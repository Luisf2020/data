import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface Props {
  url: string;
  host: string;
}

export const SignIn = ({ url, host }: Props) => {
  const previewText = `Inicia sesión en Laburen.com`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto font-sans bg-white">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px]">
            <Section className="mt-[32px]">
              <Img
                src={`https://dashboard.chatsappai.com/_next/image?url=%2Flogo.png&w=1200&q=75`}
                width="100"
                alt="Your App Name"
                className="mx-auto my-0 w-10"
              />
            </Section>
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Inicia sesión en <strong>ChatsappAI</strong>
            </Heading>
            <Text className="text-black text-[14px] text-center leading-[24px]">
              Haz clic en el botón de abajo para iniciar sesión y continuar disfrutando de nuestros
              servicios.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-4 py-3"
                href={url}
              >
                Iniciar Sesión
              </Button>
            </Section>
            <Text className="text-[#666666] text-[12px] leading-[24px] mt-4">
              Si tienes algún problema para iniciar sesión, no dudes en
              <Link href="mailto:support@chatsappai.com" className="underline">
                {' '}
                contactarnos
              </Link>
              .
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              Si no esperabas este enlace de inicio de sesión, puedes ignorar este
              correo electrónico. Si te preocupa la seguridad de tu cuenta, por favor
              responde a este correo para ponerte en contacto con nosotros.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default SignIn;
