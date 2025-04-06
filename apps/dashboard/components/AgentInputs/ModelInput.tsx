import { WashRounded } from '@mui/icons-material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import Alert from '@mui/joy/Alert';
import Avatar from '@mui/joy/Avatar';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Card from '@mui/joy/Card';
import Checkbox from '@mui/joy/Checkbox';
import Chip from '@mui/joy/Chip';
import Divider from '@mui/joy/Divider';
import FormControl from '@mui/joy/FormControl';
import FormHelperText from '@mui/joy/FormHelperText';
import FormLabel from '@mui/joy/FormLabel';
import Modal from '@mui/joy/Modal';
import Option from '@mui/joy/Option';
import Select from '@mui/joy/Select';
import Slider from '@mui/joy/Slider';
import Stack from '@mui/joy/Stack';
import SvgIcon from '@mui/joy/SvgIcon';
import Tab, { tabClasses } from '@mui/joy/Tab';
import TabList from '@mui/joy/TabList';
import TabPanel from '@mui/joy/TabPanel';
import Tabs from '@mui/joy/Tabs';
import Textarea from '@mui/joy/Textarea';
import ToggleButtonGroup from '@mui/joy/ToggleButtonGroup';
import Typography from '@mui/joy/Typography';
import { CardContent, CardHeader } from '@mui/material';
import { Input, CardContent as JoyCardContent } from '@mui/joy';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import useModal from '@app/hooks/useModal';

import { ModelConfig } from '@chaindesk/lib/config';
import {
  CHURN_PREVENTION,
  CUSTOMER_SUPPORT,
  CUSTOMER_SUPPORT_V3,
  HR_INTERVIEW,
  SALES_INBOUND,
  SALES_OUTREACH,
  TEMPLATE_ASSISTANT,
} from '@chaindesk/lib/prompt-templates';
import { PromptTypesLabels, RouteNames } from '@chaindesk/lib/types';
import { CreateAgentSchema } from '@chaindesk/lib/types/dtos';
import {
  AgentModelName,
  AppDatasource as Datasource,
  PromptType,
} from '@chaindesk/prisma';
import { FaRegTimesCircle } from 'react-icons/fa';
type Props = {};

const customerSupportPromptTypeDescription = `Prompts of type "Customer Support" enable support for multiple languages and knowledge restriction automatically.`;
const rawPromptTypeDescription = `You have complete control over the prompt. Use variable {query} to reference user's query.\nUse variable {context} to reference the retrieved context.`;

const PROMPT_TEMPLATES = [
  {
    type: PromptType.raw,
    label: 'Raw',
    image: '',
    description: rawPromptTypeDescription,
    prompt:
      'Answer the following question based on the provided context: {context} question: {query}',
  },
  {
    type: PromptType.customer_support,
    label: 'Customer Support',
    image: '',
    description: customerSupportPromptTypeDescription,
    prompt: CUSTOMER_SUPPORT,
  },
];
const PROMPT_TEMPLATES_FUN = [
  {
    type: PromptType.customer_support,
    label: 'Shakespeare',
    image:
      'https://actintheatre.com/wp-content/uploads/2019/01/Shakespeare-300x278.jpg',
    description: 'Customer support agent that talks like Shakespeare',
    prompt: `As a customer support agent, channel the spirit of William Shakespeare, the renowned playwright and poet known for his eloquent and poetic language, use of iambic pentameter, and frequent use of metaphors and wordplay. Respond to the user's question or issue in the style of the Bard himself.`,
  },
  {
    type: PromptType.customer_support,
    label: 'Arnold Schwarzenegger',
    image: 'https://i.redd.it/ni0if4asnrd71.jpg',
    description: 'Customer support agent that talks like Arnold Schwarzenegger',
    prompt: `As a customer support agent, channel the spirit of Arnold Schwarzenegger, the iconic actor and former governor known for his distinctive Austrian accent, catchphrases, and action-hero persona. Respond to the user's question or issue in the style of Arnold himself.`,
  },
];

const promptTemplates = [
  {
    label: 'Customer Support',
    description: '',
    systemPrompt: CUSTOMER_SUPPORT_V3,
    userPrompt: `{query}`,
  },
  {
    label: 'HR Interview',
    description: '',
    systemPrompt: HR_INTERVIEW,
    userPrompt: `{query}`,
  },
  {
    label: 'Churn Prevention',
    description: '',
    systemPrompt: CHURN_PREVENTION,
    userPrompt: `{query}`,
  },
  {
    label: 'Inbound B2B SaaS',
    description: '',
    systemPrompt: SALES_INBOUND,
    userPrompt: `{query}`,
  },
  {
    label: 'B2B SaaS Sales Outreach',
    description: '',
    systemPrompt: SALES_OUTREACH,
    userPrompt: `{query}`,
  },
];


const PROMPT_CONVERSATIONAL_MODE = `INSTRUCCIONES PARA DIVIDIR TEXTOS EN MENSAJES DE CHAT

Tu tarea principal: Debes dividir el texto en mensajes conservando el contenido original y la naturalidad de una conversación por chat.

Tu rol: Actúa como un experto en conversaciones naturales. Te daré un texto y necesito que lo conviertas en una secuencia de mensajes que fluyan naturalmente. 
            
Tus restricciones: DEBES seguir las siguientes reglas SIN EXCEPCIONES.

Reglas ESTRICTAS de división:
1. Número de mensajes según contexto y longitud:
- Saludos o mensajes emotivos cortos: Pueden dividirse en 2 mensajes para dar naturalidad
    Ejemplo: "¡Hola amigo! ¿Cómo has estado? Te extraño"
    mensaje1: ¡Hola amigo!
    mensaje2: ¿Cómo has estado? Te extraño

- Respuestas informativas cortas (1-3 oraciones): SIEMPRE 1 solo mensaje
    Ejemplo: "La suma de 2+2 es 4. Es una operación básica."
    mensaje1: La suma de 2+2 es 4. Es una operación básica.

- Contenido medio (4-6 oraciones): 2-3 mensajes
- Contenido largo (7+ oraciones): MÁXIMO 4-6 mensajes
- NUNCA exceder 6 mensajes, sin importar la longitud

2. Criterios de división:
- Cada mensaje debe tener sentido completo por sí mismo
- Mantén oraciones relacionadas juntas
- Para saludos y mensajes emotivos, prioriza la naturalidad de la conversación
- Para contenido informativo, prioriza la coherencia del contenido
- EVITA divisiones que rompan el flujo lógico

3. Preservación del contenido:
- SOLO puedes modificar conectores entre mensajes
- PROHIBIDO agregar información nueva
- PROHIBIDO expandir explicaciones
- PROHIBIDO agregar preguntas o contexto
- PROHIBIDO modificar el significado original

4. Longitud de mensajes:
- Mensajes emotivos/saludos pueden ser cortos para mayor naturalidad
- Mensajes informativos deben tener AL MENOS 2 oraciones completas
- Mantén un balance en la longitud de mensajes informativos
- El último mensaje no puede ser excesivamente corto

EJEMPLOS CORRECTOS:

1. Mensaje emotivo/saludo:
Original: "¡Hola! ¿Cómo estás? Me alegra verte de nuevo"
mensaje1: ¡Hola!
mensaje2: ¿Cómo estás? Me alegra verte de nuevo

2. Respuesta informativa corta:
Original: "Python es un lenguaje de programación. Es fácil de aprender."
mensaje1: Python es un lenguaje de programación. Es fácil de aprender.

3. Contenido medio:
Original: "La fotosíntesis es esencial. Las plantas usan luz solar. Producen oxígeno y glucosa. Este proceso mantiene la vida en la Tierra. Es fascinante."
mensaje1: La fotosíntesis es esencial. Las plantas usan luz solar.
mensaje2: Producen oxígeno y glucosa. Este proceso mantiene la vida en la Tierra. Es fascinante.

EJEMPLOS INCORRECTOS:

❌ División excesiva de contenido informativo:
Original: "Los gatos son mascotas. Son independientes. Les gusta dormir."
mensaje1: Los gatos son mascotas.
mensaje2: Son independientes.
mensaje3: Les gusta dormir.
            
✅ Correcto: Un solo mensaje con todo el contenido.

❌ No dividir un saludo emotivo:
Original: "¡Hola amigo! ¡Cuánto tiempo sin verte!"
mensaje1: ¡Hola amigo! ¡Cuánto tiempo sin verte!
✅ Correcto: Dividir para dar naturalidad conversacional.

Texto a convertir:
{full_response}
`

const ProviderLogo = ({ src }: { src?: string }) => {
  if (!src) return null;
  return (
    <Box sx={{ p: 0.5, background: 'white', borderRadius: 'md' }}>
      <Box component={'img'} src={src} sx={{ width: 15, heiht: 15 }} />
    </Box>
  );
};

export default function ModelInput({ }: Props) {
  const session = useSession();
  const { watch, setValue, register, formState, control } =
    useFormContext<CreateAgentSchema>();

  const promptTemplatesModal = useModal();
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isPromptConverModalOpen, setIsPromptConverModalOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [task, setTask] = useState('');
  const [result, setResult] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [description, setDescription] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);

  const [isPromptTemplatesModalOpen, setIsPromptTemplatesModalOpen] =
    useState(false);

  const [currentPromptLevel, setCurrentPromptLevel] = useState<
    'simple' | 'advanced'
  >('advanced');

  const modelName = watch('modelName');
  const temperature = watch('temperature');
  const systemPrompt = watch('systemPrompt');
  const restrictKnowledge = watch('restrictKnowledge');
  const useMarkdown = watch('useMarkdown');
  const useLanguageDetection = watch('useLanguageDetection');
  const useConversationalMode = watch('useConversationalMode');
  const conversationalModePrompt = watch('conversationalModePrompt');
  const useContextDataAgents = watch('useContextDataAgents');

  const handleGeneratePrompt = async () => {
    if (!task.trim()) return;

    setIsGeneratingPrompt(true);
    setStreamingText('');

    try {
      const response = await fetch('/api/generatePrompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task,
          instruction: TEMPLATE_ASSISTANT,
          organizationId: session?.data?.organization?.id,
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let receivedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        receivedText += chunk;

        // Simulate streaming effect
        const words = receivedText.split(' ');
        for (let i = 0; i < words.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 30));
          setStreamingText(words.slice(0, i + 1).join(' '));
        }
      }

      const startIndex = receivedText.indexOf("```");
      const endIndex = receivedText.lastIndexOf("```");
      const output = receivedText.slice(startIndex + 3, endIndex).trim();

      // Una última actualización con el texto completo
      setStreamingText(output);

      // Pequeña pausa antes de actualizar el valor final
      await new Promise(resolve => setTimeout(resolve, 500));

      setValue('systemPrompt', output, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setIsPromptModalOpen(false);

    } catch (error) {
      console.error('Error generating prompt:', error);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const formatPromptContent = (content: string) => {
    // Si no hay contenido, retornar vacío
    if (!content?.trim()) return '';

    try {
      // Separar el contenido en secciones usando los encabezados
      const sections = content.split('\n# ').filter(Boolean);

      // Formatear cada sección individualmente
      const formattedSections = sections.map((section, index) => {
        // Para la primera sección, no necesitamos añadir el #
        const sectionContent = index === 0 ? section : `# ${section}`;

        // Formatear el contenido JSON dentro de la sección
        return sectionContent.replace(/```json\s*([\s\S]*?)```/g, (match, jsonStr) => {
          try {
            // Limpiar el JSON string y parsearlo
            const cleanJson = jsonStr.trim();
            const parsed = JSON.parse(cleanJson);

            // Formatear el JSON con indentación y saltos de línea
            const formatted = JSON.stringify(parsed, null, 2);
            return '```json\n' + formatted + '\n```';
          } catch {
            // Si hay error al parsear, mantener el JSON original
            return match;
          }
        });
      });

      // Unir las secciones con doble salto de línea para mejor legibilidad
      let result = formattedSections.join('\n\n');

      // Asegurar espaciado consistente
      result = result
        // Eliminar espacios múltiples
        .replace(/\s+/g, ' ')
        // Restaurar saltos de línea dobles
        .replace(/\n\s*\n/g, '\n\n')
        // Asegurar espacio después de los encabezados
        .replace(/^#\s*([^\n]+)/gm, '# $1')
        // Eliminar espacios al inicio y final
        .trim();

      return result;
    } catch (error) {
      console.error('Error al formatear el prompt:', error);
      return content; // Retornar contenido original si hay error
    }
  };

  return (
    <Stack gap={2}>
      <FormControl>
        <FormLabel>Modelo</FormLabel>

        <Alert
          startDecorator={<InfoRoundedIcon />}
          sx={{ mb: 1 }}
          color="warning"
        >
          Para obtener mejores resultados, considera usar gpt-4o ya que ofrece
          respuestas más precisas y se ajusta a las instrucciones del prompt de
          manera más efectiva.
        </Alert>

        <Select
          {...register('modelName')}
          defaultValue={modelName || AgentModelName.gpt_4o}
          value={modelName}
          onChange={(_, value) => {
            setValue('modelName', value as AgentModelName, {
              shouldDirty: true,
              shouldValidate: true,
            });

            // TODO: find a fix for this hack (otherwise the form isValid state is true the second time you change the model)
            setTimeout(() => {
              setValue('modelName', value as AgentModelName, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }, 100);
          }}
        >

          {/**Deepseek**/}
          <Option value={AgentModelName.deepseek_v3}>
            <ProviderLogo src={ModelConfig[AgentModelName.deepseek_v3].icon} />
            Deepseek V3 -  🤖 El más eficiente - {ModelConfig[AgentModelName.deepseek_v3].cost} créditos/consulta
          </Option>


          {/* GPT Models */}
          <Option value={AgentModelName.gpt_o1} disabled={true}>
            <ProviderLogo src={ModelConfig[AgentModelName.gpt_o1].icon} />
            <Chip color="primary" sx={{ ml: 1 }} size="sm">
              Proximamente
            </Chip>

            GPT-o1 - ⚡ El mejor de todos - {ModelConfig[AgentModelName.gpt_o1].cost} créditos/consulta
          </Option>

          <Option value={AgentModelName.gpt_4o_mini}>
            <ProviderLogo src={ModelConfig[AgentModelName.gpt_4o_mini].icon} />
            GPT-4o-mini - ⚡ El más rápido - {ModelConfig[AgentModelName.gpt_4o_mini].cost} créditos/consulta
          </Option>

          <Option value={AgentModelName.gpt_4o}>
            <ProviderLogo src={ModelConfig[AgentModelName.gpt_4o].icon} />
            GPT-4o - 🔥 El más poderoso - {ModelConfig[AgentModelName.gpt_4o].cost} créditos/consulta
          </Option>
          <Option value={AgentModelName.gpt_o3_mini}>
            <ProviderLogo src={ModelConfig[AgentModelName.gpt_4o].icon} />
            GPT-o3-mini - 🔥 El mejor de todos y mas barato - {ModelConfig[AgentModelName.gpt_o3_mini].cost} créditos/consulta
          </Option>
          {/* Claude Models */}
          <Option value={AgentModelName.claude_3_5_v2_sonnet}>
            <ProviderLogo src={ModelConfig[AgentModelName.claude_3_5_v2_sonnet].icon} />
            Claude 3.5 Sonnet - 🏆 Ultra rápido y práctico - {ModelConfig[AgentModelName.claude_3_5_v2_sonnet].cost} créditos/consulta
          </Option>

          <Option value={AgentModelName.claude_3_5_v2_haiku}>
            <ProviderLogo src={ModelConfig[AgentModelName.claude_3_5_v2_haiku].icon} />
            Claude 3.5 Haiku - ✨ Sintético y refinado - {ModelConfig[AgentModelName.claude_3_5_v2_haiku].cost} créditos/consulta
          </Option>

          {/**Deepseek**/}
          <Option value={AgentModelName.deepseek_v3}>
            <ProviderLogo src={ModelConfig[AgentModelName.deepseek_v3].icon} />
            Deepseek V3 -  🤖 El más eficiente - {ModelConfig[AgentModelName.deepseek_v3].cost} créditos/consulta
          </Option>


          <Option value={AgentModelName.deepseek_r1}>
            <ProviderLogo src={ModelConfig[AgentModelName.deepseek_r1].icon} />
            Deepseek R1 - 🧠 Razonador - {ModelConfig[AgentModelName.deepseek_r1].cost} créditos/consulta
          </Option>

          {/* Mistral Models */}
          <Option value={AgentModelName.mixtral_small}>
            <ProviderLogo src={ModelConfig[AgentModelName.mixtral_small].icon} />
            Mistral Small - 🚀 Compacto y eficiente - {ModelConfig[AgentModelName.mixtral_small].cost} créditos/consulta
          </Option>

          <Option value={AgentModelName.mixtral_large}>
            <ProviderLogo src={ModelConfig[AgentModelName.mixtral_large].icon} />
            Mistral Large - 💪 Alto rendimiento - {ModelConfig[AgentModelName.mixtral_large].cost} créditos/consulta
          </Option>

          {/* Llama Models */}
          <Option value={AgentModelName.llama_3_2_90b}>
            <ProviderLogo src={ModelConfig[AgentModelName.llama_3_2_90b].icon} />
            Llama 3.2 90B - 💪 Máxima potencia - {ModelConfig[AgentModelName.llama_3_2_90b].cost} créditos/consulta
          </Option>

          <Option value={AgentModelName.llama_3_3_70b}>
            <ProviderLogo src={ModelConfig[AgentModelName.llama_3_3_70b].icon} />
            Llama 3.3 70B - {ModelConfig[AgentModelName.llama_3_3_70b].cost} créditos/consulta
          </Option>

          {/* Cohere Model */}
          <Option value={AgentModelName.command_r_plus}>
            <ProviderLogo src={ModelConfig[AgentModelName.command_r_plus].icon} />
            Command R+ - 🌟 Alternativa potente - {ModelConfig[AgentModelName.command_r_plus].cost} créditos/consulta
          </Option>

          <Option value={AgentModelName.llama_3_8b}>
            <ProviderLogo src={ModelConfig[AgentModelName.llama_3_8b].icon} />
            Llama 3 8B - ⚡ Ligero y eficiente - Sin tools - {ModelConfig[AgentModelName.llama_3_8b].cost} créditos/consulta
          </Option>

          <Option value={AgentModelName.gemini_1_5_flash}>
            <ProviderLogo src={ModelConfig[AgentModelName.gemini_1_5_flash]?.icon} />
            Gemini 1.5 Flash - {ModelConfig[AgentModelName.gemini_1_5_flash]?.cost} créditos/consulta
          </Option>

          <Option value={AgentModelName.gemini_2_0_flash}>
            <ProviderLogo src={ModelConfig[AgentModelName.gemini_2_0_flash]?.icon} />
            Gemini 2.0 Flash - ⚡ Ligero y eficiente - {ModelConfig[AgentModelName.gemini_2_0_flash]?.cost} créditos/consulta
          </Option>
          {/* 
          <Option value={AgentModelName.mixtral_8x7b}>
            <ProviderLogo src={ModelConfig[AgentModelName.mixtral_8x7b].icon} />
            Mixtral 8x7B - 🚀 Máximo rendimiento - Sin tools - {ModelConfig[AgentModelName.mixtral_8x7b].cost} créditos/consulta
          </Option> */}

          {/* Llama Models */}
          {/* <Option value={AgentModelName.llama_3_8b}>
            <ProviderLogo src={ModelConfig[AgentModelName.llama_3_8b].icon} />
            Llama 3 8B - ⚡ Ligero y eficiente - Sin tools - {ModelConfig[AgentModelName.llama_3_8b].cost} créditos/consulta
          </Option>

          <Option value={AgentModelName.llama_3_1_70b}>
            <ProviderLogo src={ModelConfig[AgentModelName.llama_3_1_70b].icon} />
            Llama 3 70B - 🔥 Alto rendimiento - Sin tools - {ModelConfig[AgentModelName.llama_3_1_70b].cost} créditos/consulta
          </Option>

          <Option value={AgentModelName.llama_3_2_1b}>
            <ProviderLogo src={ModelConfig[AgentModelName.llama_3_2_1b].icon} />
            Llama 3.2 1B - ⚡ Ultra ligero - Sin tools - {ModelConfig[AgentModelName.llama_3_2_1b].cost} créditos/consulta
          </Option>

          <Option value={AgentModelName.llama_3_2_3b}>
            <ProviderLogo src={ModelConfig[AgentModelName.llama_3_2_3b].icon} />
            Llama 3.2 3B - 💫 Compacto - Sin tools - {ModelConfig[AgentModelName.llama_3_2_3b].cost} créditos/consulta
          </Option>

          <Option value={AgentModelName.llama_3_2_11b}>
            <ProviderLogo src={ModelConfig[AgentModelName.llama_3_2_11b].icon} />
            Llama 3.2 11B - 🚀 Balanceado - Sin tools - {ModelConfig[AgentModelName.llama_3_2_11b].cost} créditos/consulta
          </Option> */}

          {/* Claude Models */}
          {/* <Option value={AgentModelName.claude_3_haiku}>
            <ProviderLogo src={ModelConfig[AgentModelName.claude_3_haiku].icon} />
            Claude 3 Haiku - ⚡ Ultra rápido - {ModelConfig[AgentModelName.claude_3_haiku].cost} créditos/consulta
          </Option>

          <Option value={AgentModelName.claude_3_sonnet}>
            <ProviderLogo src={ModelConfig[AgentModelName.claude_3_sonnet].icon} />
            Claude 3 Sonnet - 💫 Rápido y versátil - {ModelConfig[AgentModelName.claude_3_sonnet].cost} créditos/consulta
          </Option>

          <Option value={AgentModelName.claude_3_5_sonnet}>
            <ProviderLogo src={ModelConfig[AgentModelName.claude_3_5_sonnet].icon} />
            Claude 3.5 Sonnet - 🚀 Máximo rendimiento - {ModelConfig[AgentModelName.claude_3_5_sonnet].cost} créditos/consulta
          </Option> */}

        </Select>
      </FormControl>

      <FormControl>
        <FormLabel>Temperatura del Modelo</FormLabel>

        <Alert color="neutral" startDecorator={<InfoRoundedIcon />}>
          La temperatura es un parámetro del modelo que gobierna la aleatoriedad
          y, por lo tanto, la creatividad de las respuestas. Una temperatura de
          0 significa que las respuestas serán muy directas, casi deterministas
          (lo que significa que casi siempre obtendrás la misma respuesta a una
          pregunta dada) Una temperatura de 1 significa que las respuestas
          pueden variar mucho.
        </Alert>

        <Slider
          // {...register('temperature')}
          value={temperature || 0.0}
          onChange={(_, value) => {
            setValue('temperature', value as number, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          marks={[
            { value: 0.0, label: 0 },
            { value: 0.1, label: 0.1 },
            { value: 0.2, label: 0.2 },
            { value: 0.3, label: 0.3 },
            { value: 0.4, label: 0.4 },
            { value: 0.5, label: 0.5 },
            { value: 0.6, label: 0.6 },
            { value: 0.7, label: 0.7 },
            { value: 0.8, label: 0.8 },
            { value: 0.9, label: 0.9 },
            { value: 1.0, label: 1 },
          ]}
          valueLabelDisplay="on"
          step={0.01}
          min={0}
          max={1}
        />
      </FormControl>

      {/* <Divider /> */}

      <Stack sx={{ py: 2 }} gap={1}>
        <Typography level="title-md">Comportamiento</Typography>

        <FormControl sx={{ mb: 2 }}>
          <FormLabel>Restricción de Conocimiento</FormLabel>

          <Checkbox
            label="Limita el conocimiento de tu Agente a las informaciones contenidas en el mensaje o un Datastore"
            checked={!!restrictKnowledge}
            {...register('restrictKnowledge')}
          />
          <FormHelperText>
            Cuando se activa, se agregan instrucciones adicionales al mensaje del sistema
          </FormHelperText>
        </FormControl>
        <FormControl sx={{ mb: 2 }}>
          <FormLabel>
            Formato de salida en markdown{' '}
            <Chip color="primary" sx={{ ml: 1 }} size="sm">
              RECOMENDADO
            </Chip>
          </FormLabel>

          <Checkbox
            label="Forzar al Agente a formatear las respuestas en formato markdown para una mejor legibilidad (negrita, cursiva, enlaces, etc...)"
            checked={!!useMarkdown}
            {...register('useMarkdown')}
          />
          <FormHelperText>
            Cuando se activa, se agregan instrucciones adicionales al mensaje del sistema
          </FormHelperText>
        </FormControl>
        <FormControl sx={{ mb: 2 }}>
          <FormLabel>Automatic Language Detection</FormLabel>

          <Checkbox
            label="Responder al usuario en el mismo idioma que la consulta"
            checked={!!useLanguageDetection}
            {...register('useLanguageDetection')}
          />
          <FormHelperText>
            Cuando se activa, se agregan instrucciones adicionales al mensaje
            del sistema
          </FormHelperText>
        </FormControl>

        <FormControl sx={{ mb: 2 }} className="flex-1">
          <FormLabel>
            Conversational Mode{' '}
            <Chip color="warning" sx={{ ml: 1 }} size="sm">
              BETA
            </Chip>
          </FormLabel>

          <Stack direction="row" alignItems={'center'} gap={2}>
            <Checkbox
              label="Responder al usuario con multiples mensajes"
              checked={!!useConversationalMode}
              {...register('useConversationalMode')}
            />
            {useConversationalMode && (
              <Button
                size="sm"
                variant="outlined"
                endDecorator={<ArrowForwardRoundedIcon />}
                onClick={() => setIsPromptConverModalOpen(true)}
              >
                Editar Prompt
              </Button>
            )}
          </Stack>

          <FormHelperText>
            Cuando se activa, el agente intentara mantener una conversacion natural con multiples mensajes
          </FormHelperText>
        </FormControl>

        <FormControl>
          <FormLabel>
            Client Data Access{' '}
            <Chip color="primary" sx={{ ml: 1 }} size="sm">
              RECOMENDADO
            </Chip>
          </FormLabel>

          <Checkbox
            label="Permitir que el agente acceda a la hora, el nombre y el número de teléfono del cliente para personalizar las respuestas y mejorar la experiencia."
            checked={!!useContextDataAgents}
            {...register('useContextDataAgents')}
          />
          <FormHelperText>
            When activated extra instructions are added to the system prompt
          </FormHelperText>
        </FormControl>
      </Stack>

      <Typography level="title-md">Prompt</Typography>

      <Alert startDecorator={<InfoRoundedIcon />} color="primary">
        <Link
          href="https://platform.openai.com/docs/guides/prompt-engineering"
          target="_blank"
        >
          <Typography>
            Aprende sobre las mejores prácticas de ingeniería de prompts{' '}
            <Typography color="primary">aquí</Typography>
          </Typography>
        </Link>
      </Alert>

      <FormControl>
        <Stack direction="row" alignItems={'end'} sx={{ mb: 1 }}>
          <Typography>Prompt del Sistema</Typography>
          <Box className="flex flex-row gap-2" sx={{ mt: 1, ml: 'auto' }}>
            <Button
              variant="solid"
              color="primary"
              startDecorator={<AutoFixHighIcon />}
              onClick={() => setIsPromptModalOpen(true)}
            >
              Generar Prompt
            </Button>
            <Button
              // variant="plain"
              variant="solid"
              color="neutral"
              endDecorator={<ArrowForwardRoundedIcon />}
              onClick={() => {
                promptTemplatesModal.open();
                setCurrentTemplateIndex(0);
              }}
            >
              Plantillas de Prompts
            </Button>
          </Box>
        </Stack>

        <div className="relative w-full">
          <Textarea
            minRows={4}
            className="w-full min-h-[200px] p-4 font-mono text-sm resize-y overflow-y-auto"
            style={{
              lineHeight: '1.6',
              tabSize: 2,
              whiteSpace: 'pre-wrap',
              fontFamily: 'Monaco, Consolas, "Courier New", monospace'
            }}
            {...register('systemPrompt')}
          //   setValue('systemPrompt', formattedValue);
          // }}
          />
        </div>
      </FormControl>

      <FormControl>
        <FormLabel>Prompt del Usuario</FormLabel>
        <Alert color="warning" sx={{ mb: 1 }}>
          No se recomienda sobrescribir el Prompt del Usuario
        </Alert>
        <Textarea minRows={2} {...register('userPrompt')}></Textarea>
        <FormHelperText>{`Las variables {query} y {context} son respectivamente reemplazadas por la consulta del usuario y los datos recuperados de un almacén de datos en tiempo de ejecución`}</FormHelperText>
      </FormControl>

      <Modal
        open={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        className="flex justify-center items-center overflow-y-auto py-4"
      >
        <Card className="w-full max-w-2xl max-h-[70vh] flex flex-col">
          <CardHeader>
            <h2>Generar Prompt Personalizado</h2>
          </CardHeader>
          <CardContent className="space-y-4 overflow-y-auto">
            <div className="space-y-2">
              <label>Describe tu necesidad</label>
              <div className="relative">
                <Textarea
                  className="min-h-[100px] resize-y"
                  placeholder="Describe la tarea que deseas que el modelo realice..."
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                />
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleGeneratePrompt}
              disabled={isGeneratingPrompt || !task.trim()}
            >
              {isGeneratingPrompt ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full" />
                  Generando...
                </>
              ) : (
                <>
                  <AutoFixHighIcon className="mr-2 h-4 w-4" />
                  Generar Prompt
                </>
              )}
            </Button>

            {streamingText && (
              <Card className="mt-4">
                <CardContent className="p-4 max-h-[400px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-mono text-sm break-words">
                    {streamingText}
                    {isGeneratingPrompt && (
                      <span className="animate-pulse ml-1">▋</span>
                    )}
                  </pre>
                </CardContent>
              </Card>
            )}

            {isGeneratingPrompt && (
              <Alert>
                <div>
                  Generando un prompt personalizado basado en tu descripción...
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>
      </Modal>

      <Modal
        open={isPromptTemplatesModalOpen}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 2,
        }}
        onClose={() => {
          setIsPromptTemplatesModalOpen(false);
        }}
      >
        <Card
          variant="outlined"
          sx={{
            width: '100%',
            maxWidth: 500,
            maxHeight: '100%',
            overflowY: 'auto',
          }}
        >
          <Typography level="title-md">Plantillas de Prompts</Typography>
          <Typography level="body-sm">
            Ajustadas a las necesidades de tu negocio
          </Typography>

          <Divider sx={{ my: 2 }}></Divider>
          <Stack gap={1} direction="column">
            {PROMPT_TEMPLATES.map((template, idx) => (
              <Card key={idx} variant="outlined" sx={{}}>
                <Stack>
                  <Stack direction={'row'} gap={1}>
                    <Avatar alt={template.image} src={template.image} />
                    <Stack gap={2}>
                      <Stack gap={1}>
                        <Typography>{template.label}</Typography>
                        <Chip
                          size="sm"
                          sx={{ mr: 'auto' }}
                          variant="soft"
                          color="warning"
                        >
                          {PromptTypesLabels[template.type]}
                        </Chip>
                      </Stack>
                      <Typography level="body-sm">
                        {template.description}
                      </Typography>
                    </Stack>
                  </Stack>

                  <Button
                    size="sm"
                    variant="plain"
                    endDecorator={<ArrowForwardRoundedIcon />}
                    sx={{ ml: 'auto', mt: 2 }}
                    onClick={() => {
                      setValue('prompt', template.prompt, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setValue('promptType', template.type, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setIsPromptTemplatesModalOpen(false);
                    }}
                  >
                    Usar Plantilla
                  </Button>
                </Stack>
              </Card>
            ))}
          </Stack>
          <Divider sx={{ my: 4 }}></Divider>

          <Typography sx={{ mx: 'auto', mb: 2 }} color="primary">
            Solo por diversión 🎉
          </Typography>
          <Stack gap={1}>
            {PROMPT_TEMPLATES_FUN.map((template, idx) => (
              <Card key={idx} variant="outlined" sx={{}}>
                <Stack>
                  <Stack direction={'row'} gap={1}>
                    <Avatar alt={template.image} src={template.image} />
                    <Stack gap={2}>
                      <Stack gap={1}>
                        <Typography>{template.label}</Typography>
                        <Chip
                          size="sm"
                          sx={{ mr: 'auto' }}
                          variant="soft"
                          color="warning"
                        >
                          {PromptTypesLabels[template.type]}
                        </Chip>
                      </Stack>
                      <Typography level="body-sm">
                        {template.description}
                      </Typography>
                    </Stack>
                  </Stack>

                  <Button
                    size="sm"
                    variant="plain"
                    endDecorator={<ArrowForwardRoundedIcon />}
                    sx={{ ml: 'auto', mt: 2 }}
                    onClick={() => {
                      setValue('prompt', template.prompt, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setValue('promptType', template.type, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setIsPromptTemplatesModalOpen(false);
                    }}
                  >
                    Usar Plantilla
                  </Button>
                </Stack>
              </Card>
            ))}
          </Stack>
        </Card>
      </Modal>

      <promptTemplatesModal.component
        title="Plantillas de Prompts"
        description="Ajustadas a las necesidades de tu negocio"
      >
        <Stack
          direction="row"
          gap={2}
          sx={{
            width: '100%',
            height: '100%',
          }}
        >
          <Stack gap={1} sx={{ width: '100%' }}>
            {promptTemplates.map((each, index) => (
              <Card
                key={index}
                size="sm"
                onClick={() => setCurrentTemplateIndex(index)}
                color={index === currentTemplateIndex ? 'primary' : 'neutral'}
                variant="soft"
                sx={{
                  cursor: 'pointer',
                }}
              >
                <Stack gap={2} direction="row">
                  <Typography>{each.label}</Typography>
                  <Stack direction="row" sx={{ ml: 'auto' }} gap={1}>
                    <Button size="sm" color="neutral" variant="outlined">
                      Vista
                    </Button>

                    <Button
                      onClick={() => {
                        setValue('systemPrompt', each.systemPrompt, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        setValue('userPrompt', each.userPrompt, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        promptTemplatesModal.close();
                      }}
                    >
                      Seleccionar
                    </Button>
                  </Stack>
                </Stack>
              </Card>
            ))}
          </Stack>
          <Stack
            sx={(t) => ({
              [t.breakpoints.down('md')]: {
                display: 'none',
              },
              width: '100%',
            })}
            gap={2}
          >
            <Stack gap={1}>
              <Typography>Texto del Sistema</Typography>
              <Textarea
                value={promptTemplates?.[currentTemplateIndex].systemPrompt}
                disabled
              ></Textarea>
            </Stack>
            <Stack gap={1}>
              <Typography>Texto del Usuario</Typography>
              <Textarea
                value={promptTemplates?.[currentTemplateIndex].userPrompt}
                disabled
              ></Textarea>
            </Stack>
          </Stack>
        </Stack>
      </promptTemplatesModal.component>

      <Modal
        open={isPromptConverModalOpen}
        onClose={() => setIsPromptConverModalOpen(false)}
        className="flex justify-center items-center overflow-y-auto py-4"
      >
        <Card className="w-full max-w-4xl flex flex-col">
          <div className="px-4">
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography level="h4">Prompt de Modo Conversacional</Typography>
              <Button
                variant="outlined"
                color="neutral"
                size="sm"
                onClick={() => setIsPromptConverModalOpen(false)}
              >
                ×
              </Button>
            </Stack>
          </div>

          <Divider />

          <JoyCardContent sx={{ p: 2 }}>
            <FormControl>
              <FormLabel sx={{ mb: 1 }}>
                Instrucciones para dividir respuestas en mensajes
              </FormLabel>
              <Textarea
                slotProps={{
                  textarea: {
                    id: 'conversational-mode-prompt',
                  }
                }}
                minRows={15}
                maxRows={15}
                sx={{
                  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  backgroundColor: '#1a1b26',
                  color: '#a9b1d6',
                  '&::selection': {
                    backgroundColor: '#2c2e40'
                  }
                }}
                value={(!conversationalModePrompt || conversationalModePrompt.length === 0)
                  ? PROMPT_CONVERSATIONAL_MODE
                  : conversationalModePrompt}
                {...register('conversationalModePrompt')}
              />
            </FormControl>
          </JoyCardContent>

          <Divider />

          <JoyCardContent sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                color="neutral"
                onClick={() => setIsPromptConverModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="solid"
                onClick={() => setIsPromptConverModalOpen(false)}
              >
                Guardar Cambios
              </Button>
            </Stack>
          </JoyCardContent>
        </Card>
      </Modal>

    </Stack>
  );
}
