import Portkey from 'portkey-ai';
import { v4 as uuidv4 } from 'uuid';

interface MessagePart {
  id: string;
  content: string;
}

interface SplitFunction {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: {
      messages: {
        type: string;
        items: {
          type: string;
          properties: {
            content: {
              type: string;
              description: string;
            };
          };
          required: string[];
        };
      };
    };
    required: string[];
  };
}

export class MessageSplitter {
  private client: Portkey;
  private splitFunction: SplitFunction;
  /**
   * promptConversationModel se establecerá SIEMPRE 
   * a este texto por defecto, sin opción de sobreescribir.
   */
  private promptConversationModel: string;

  constructor() {
    this.client = new Portkey({
      apiKey: process.env.PORTKEY_API_KEY,
      provider: "azure-openai",
      azureResourceName: "openai-chatsappai",
      azureDeploymentId: "gpt-4o-mini",
      azureApiVersion: "2024-03-01-preview",
      Authorization: `Bearer ${process.env.AZURE_OPENAI_API_KEY}`,
    });

    // Forzamos el prompt por defecto (sin permitir que el usuario defina otro)
    this.promptConversationModel = `INSTRUCCIONES PARA DIVIDIR TEXTOS EN MENSAJES DE CHAT

Tu tarea principal: Dividir el texto en mensajes conservando el contenido original y la naturalidad de una conversación por chat.

Tu rol: Actúa como un experto en conversaciones naturales. Te daré un texto y necesito que lo conviertas en una secuencia de mensajes que fluyan de manera coherente.

Tus restricciones: DEBES seguir las siguientes reglas SIN EXCEPCIONES.

Reglas ESTRICTAS de división:
1. Número de mensajes según contexto y longitud:
   - Saludos o mensajes emotivos cortos: Pueden dividirse en 2 mensajes para dar naturalidad.
     Ejemplo: "¡Hola amigo! ¿Cómo has estado? Te extraño"
     mensaje1: ¡Hola amigo!
     mensaje2: ¿Cómo has estado? Te extraño
   - Respuestas informativas cortas (1-3 oraciones): SIEMPRE 1 solo mensaje.
     Ejemplo: "La suma de 2+2 es 4. Es una operación básica."
     mensaje1: La suma de 2+2 es 4. Es una operación básica.
   - Contenido medio (4-6 oraciones): 2-3 mensajes.
   - Contenido largo (7+ oraciones): MÁXIMO 4-6 mensajes.
   - NUNCA exceder 6 mensajes, sin importar la longitud.

2. Criterios de división:
   - Cada mensaje debe tener sentido completo por sí mismo.
   - Mantén oraciones relacionadas juntas.
   - Para saludos y mensajes emotivos, prioriza la naturalidad de la conversación.
   - Para contenido informativo, prioriza la coherencia del contenido.
   - EVITA divisiones que rompan el flujo lógico.

3. Preservación del contenido:
   - SOLO puedes modificar conectores entre mensajes.
   - PROHIBIDO agregar información nueva o expandir explicaciones.
   - PROHIBIDO agregar preguntas o contexto adicional.
   - PROHIBIDO modificar el significado original.
   - **Regla Adicional:** Si el mensaje contiene elementos multimedia, como imágenes en formato Markdown (por ejemplo, ![texto alternativo](URL)), DEBES conservarlos en el mismo bloque en el que aparecen. No se deben separar del contexto.

4. Longitud de mensajes:
   - Mensajes emotivos/saludos pueden ser cortos para mayor naturalidad.
   - Mensajes informativos deben tener AL MENOS 2 oraciones completas.
   - Mantén un balance en la longitud de mensajes informativos.
   - El último mensaje no puede ser excesivamente corto.

EJEMPLOS CORRECTOS:

1. Mensaje emotivo/saludo:
   Original: "¡Hola! ¿Cómo estás? Me alegra verte de nuevo"
   mensaje1: ¡Hola!
   mensaje2: ¿Cómo estás? Me alegra verte de nuevo

2. Respuesta informativa corta:
   Original: "Python es un lenguaje de programación. Es fácil de aprender."
   mensaje1: Python es un lenguaje de programación. Es fácil de aprender.

3. Contenido medio con imagen:
   Original:
     "¡Aquí tienes un lindo gatito mimoso para alegrar tu día! 😺✨
     ![Gatito Mimoso](https://cdn2.thecatapi.com/images/58d.jpg)
     Si necesitas algo más, ¡déjame saber!"
   mensaje1: "¡Aquí tienes un lindo gatito mimoso para alegrar tu día! 😺✨
   ![Gatito Mimoso](https://cdn2.thecatapi.com/images/58d.jpg)"
   mensaje2: "Si necesitas algo más, ¡déjame saber!"

EJEMPLOS INCORRECTOS:

❌ Separar el enlace de la imagen del mensaje:
   Original:
     "¡Aquí tienes un lindo gatito mimoso para alegrar tu día! 😺✨
     ![Gatito Mimoso](https://cdn2.thecatapi.com/images/58d.jpg)
     Si necesitas algo más, ¡déjame saber!"
   Incorrecto:
     mensaje1: "¡Aquí tienes un lindo gatito mimoso para alegrar tu día! 😺✨"
     mensaje2: "![Gatito Mimoso](https://cdn2.thecatapi.com/images/58d.jpg)"
     mensaje3: "Si necesitas algo más, ¡déjame saber!"

Texto a convertir:
{full_response}`;

    this.splitFunction = {
      name: "split_message",
      description: `Divide un mensaje en partes conversacionales siguiendo estas reglas ESTRICTAS:

        1. Para 1 a 3 oraciones: UN SOLO mensaje.
        2. Para 4 a 6 oraciones: 2 mensajes.
        3. Para 7 o más oraciones: máximo 3 mensajes.
        4. NUNCA exceder 3 mensajes en total.
        5. Cada mensaje debe tener sentido completo y conservar el orden lógico.
        6. NO agregar información nueva ni modificar el contenido original.
        7. El último mensaje no debe ser excesivamente corto (al menos 1-2 oraciones).
        8. **Regla Adicional:** si el mensaje contiene elementos multimedia (Markdown, imágenes, etc.),
          estos deben mantenerse en el mismo bloque donde aparecen, sin separarlos.`,
      parameters: {
        type: "object",
        properties: {
          messages: {
            type: "array",
            items: {
              type: "object",
              properties: {
                content: {
                  type: "string",
                  description: "Parte natural de la conversación, preservando elementos multimedia si están presentes",
                },
              },
              required: ["content"],
            },
          },
        },
        required: ["messages"],
      },
    };
  }
  /**
   * Divide un mensaje largo en partes conversacionales.
   * @param message - Mensaje a dividir.
   * @returns Arreglo de partes del mensaje.
   */
  async splitMessage(message: string): Promise<MessagePart[]> {
    try {
      const completion = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: this.promptConversationModel,
          },
          {
            role: "user",
            content: message,
          },
        ],
        tools: [
          {
            type: "function",
            function: this.splitFunction,
          },
        ],
        tool_choice: { type: "function", function: { name: "split_message" } },
      });

      const toolCalls = completion.choices[0].message?.tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
        return [{ id: uuidv4(), content: message }];
      }

      const splitResult = JSON.parse(toolCalls[0].function.arguments);
      return splitResult.messages.map((msg: { content: string }) => ({
        id: uuidv4(),
        content: msg.content,
      }));
    } catch (error) {
      console.error("Error splitting message:", error);
      // En caso de error, se retorna el mensaje original como única parte.
      return [{ id: uuidv4(), content: message }];
    }
  }
}
