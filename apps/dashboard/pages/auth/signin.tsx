import { Transition } from '@headlessui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import GitHubIcon from '@mui/icons-material/GitHub';
import { Box, Button, Divider, Typography, useColorScheme } from '@mui/joy';
import CircularProgress from '@mui/joy/CircularProgress';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { signIn, useSession } from 'next-auth/react';
// import { parseCookies } from 'nookies';
import React, { useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AnalyticsContext } from '@app/components/Analytics';
import Logo from '@app/components/Logo';
import SEO from '@app/components/SEO';

import { appUrl } from '@chaindesk/lib/config';
import { RouteNames } from '@chaindesk/lib/types';
import Input from '@chaindesk/ui/Input';
import { useFacebookLogin } from '@app/hooks/useFacebookLogin';
import { IoLogoMicrosoft } from 'react-icons/io5';
import { FaFacebook } from 'react-icons/fa';
import Image from 'next/image';

type Props = {
  // subscription: Subscription | null;
};

type Fields = {
  email: string;
  password: string;
};

const Schema = z.object({
  email: z.string().email(),
});

type Schema = z.infer<typeof Schema>;

export default function SignInPage() {
  // const { handleRedirects, handleSignInSuccess } = useAuth();
  const [globalFormError, setGlobalFormError] = useState<string>();
  const { mode, setMode } = useColorScheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { capture } = useContext(AnalyticsContext);
  useEffect(() => {
    if (status === 'unauthenticated') {
      setIsReady(true);
    } else if (status === 'authenticated') {
      capture?.({ event: 'login' });

      const redirect = router.query.redirect as string | undefined;

      if (redirect) {
        // https://github.com/gmpetrov/databerry/issues/204
        // router.push(redirect);
        window.location.href = redirect;
      } else {
        // router.push(RouteNames.HOME);
        window.location.href = RouteNames.HOME;
      }
    }
  }, [status, router]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: {},
  });

  const handleSubmitEmail = async (values: Schema) => {
    try {
      setIsLoading(true);
      await signIn('email', { email: values.email });
    } catch {
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <SEO
        title="Sign-in"
        description="Sign-in to your ChatsappAIaccount."
        baseUrl={appUrl}
        uri={RouteNames.SIGN_IN}
      />
      <Head>
        <link
          href="https://fonts.googleapis.com/css?family=Roboto"
          rel="stylesheet"
          type="text/css"
        />
      </Head>
      <Box
        className="min-h-screen w-screen max-w-[100%] flex relative"
        sx={(theme) => ({
          // background: theme.palette.background.surface,
        })}
      >
        <>
          <div className="flex flex-col justify-center flex-1 px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
            <div className={`flex gap-9 ${!isReady ? '' : 'border shadow'} w-max-sm w-[800px] rounded-xl mx-auto z-50 p-5`}>
              {isReady && (
                <div className='w-full'>
                  <Image
                    src="/consu.png"
                    alt="Consu"
                    width={200}
                    height={200}
                    className="mx-auto"
                  />
                  <Typography className="mt-4 font-semibold text-2xl">
                    Consu
                  </Typography>
                  <Typography className="font-medium text-md">
                    Soporte al Cliente y Post-Venta
                  </Typography>
                  <Typography className="text-sm">
                    Encargada de asesorar al cliente en todo el proceso después de la compra, garantizando su satisfacción.
                  </Typography>
                </div>
              )}
              {!isReady && (
                <CircularProgress
                  size="sm"
                  variant="soft"
                  sx={{ mx: 'auto' }}
                />
              )}
              <Transition
                className={'w-full'}
                show={isReady}
                enter="duration-[350ms]"
                enterFrom="opacity-0 translate-y-[100px]"
                enterTo="opacity-100 translate-y-[0px] w-full"
              // leave="transition-opacity duration-150"
              // leaveFrom="opacity-100"
              // leaveTo="opacity-0"
              >
                <div className="flex flex-col items-center justify-center ">
                  <div className="inline-flex items-center mr-auto space-x-2">
                    <a
                      href="https://dashboard.chatsappai.com/auth/signin"
                    // className="absolute top-4 left-4 md:top-8 md:left-8"
                    >
                      <div className="flex justify-center mx-auto items-center space-x-2">
                        <div className="flex items-center justify-center w-8 h-8 bg-transparent rounded shadow-sm shadow-zinc-950/20">
                          <Logo className="cursor-pointer w-14 rounded-lg border dark:border-gray-700" />
                        </div>
                        <Typography level="h4" fontWeight="xl">
                          {`Laburen`}
                        </Typography>
                      </div>
                    </a>
                  </div>
                </div>

                <div className="w-full mt-8">
                  <div className="w-full mt-6">
                    <form
                      className="flex flex-col w-full space-y-4"
                      onSubmit={handleSubmit(handleSubmitEmail)}
                    >
                      <Input
                        label="Dirección de correo electrónico"
                        control={control as any}
                        size="lg"
                        {...register('email')}
                      ></Input>

                      <Button
                        // disabled={!isValid}
                        type="submit"
                        variant="solid"
                        color="primary"
                        size="lg"
                        loading={isLoading}
                      >
                        Iniciar sesión
                      </Button>
                    </form>
                  </div>

                  <div className="mt-8">
                    <div className="relative">
                      <div className="absolute inset-0 flex justify-center">
                        <Divider sx={{ width: '100%', my: 'auto' }} />

                        {/* <div className="w-full border-t border-gray-500" /> */}
                      </div>
                      <div className="relative flex justify-center">
                        <Typography
                          level="body-xs"
                          className="px-2"
                          sx={{ backgroundColor: 'background.surface' }}
                        >
                          O continuar con
                        </Typography>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 mt-6 cursor-pointer">
                      <Button
                        size="lg"
                        onClick={() => signIn('google')}
                        variant="outlined"
                        color="neutral"
                        startDecorator={
                          <img
                            style={{
                              width: '20px',
                              height: '20px',
                              marginRight: '0px',
                            }}
                            src="/google-icon.png"
                          />
                        }
                        sx={{
                          fontFamily: 'Inter',
                          backgroundColor: 'white dark:bg-black',
                          color: '#1F1F1F dark:text-white',
                          fontWeight: 500,
                          fontSize: '14px',
                          minHeight: '40px',
                          cursor: 'pointer',

                          '&:hover': {
                            backgroundColor: '#f0f0f0 dark:bg-gray-800',
                          },
                        }}
                      >
                        Iniciar sesión con Google
                      </Button>
                      <Button
                        size="lg"
                        onClick={() => signIn('facebook')}
                        variant="outlined"
                        color="neutral"
                        startDecorator={
                          <FaFacebook size={20} />
                        }
                        sx={{
                          fontFamily: 'Inter',
                          backgroundColor: 'white dark:bg-black',
                          color: '#1F1F1F dark:text-white',
                          fontWeight: 500,
                          fontSize: '14px',
                          minHeight: '40px',
                          cursor: 'pointer',

                          '&:hover': {
                            backgroundColor: '#f0f0f0 dark:bg-gray-800',
                          },
                        }}
                      >
                        Iniciar sesión con Facebook
                      </Button>
                      <Button
                        size="lg"
                        onClick={() => signIn('azure-ad')}
                        variant="outlined"
                        color="neutral"
                        startDecorator={
                          <IoLogoMicrosoft size={20} />
                        }
                        sx={{
                          fontFamily: 'Inter',
                          backgroundColor: 'white dark:bg-black',
                          color: '#1F1F1F dark:text-white',
                          fontWeight: 500,
                          fontSize: '14px',
                          minHeight: '40px',
                          cursor: 'pointer',

                          '&:hover': {
                            backgroundColor: '#f0f0f0 dark:bg-gray-800',
                          },
                        }}
                      >
                        Iniciar sesión con Microsoft
                      </Button>

                      <Button
                        size="lg"
                        onClick={() => signIn('github')}
                        variant="outlined"
                        color="neutral"
                        startDecorator={
                          <GitHubIcon />
                        }
                        sx={{
                          fontFamily: 'Inter',
                          backgroundColor: 'white dark:bg-black',
                          color: '#1F1F1F dark:text-white',
                          fontWeight: 500,
                          fontSize: '14px',
                          minHeight: '40px',
                          cursor: 'pointer',

                          '&:hover': {
                            backgroundColor: '#f0f0f0 dark:bg-gray-800',
                          },
                        }}
                      >
                        Iniciar sesión con Github
                      </Button>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </>
      </Box >
    </>
  );
}
