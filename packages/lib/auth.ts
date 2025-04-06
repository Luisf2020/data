import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { NextApiRequest, NextApiResponse } from 'next';
import { AuthOptions, Session } from 'next-auth';
import { AdapterUser } from 'next-auth/adapters';
import { getServerSession } from 'next-auth/next';
import { Provider, OAuthConfig, OAuthUserConfig } from 'next-auth/providers';
import AzureADProvider from "next-auth/providers/azure-ad";
import FacebookProvider from "next-auth/providers/facebook";
import EmailProvider from 'next-auth/providers/email';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { Middleware } from 'next-connect';
import requestIp from 'request-ip';
import { v4 as uuidv4 } from 'uuid';

import generateFunId from '@chaindesk/lib/generate-fun-id';
import logger from '@chaindesk/lib/logger';
import { AppNextApiRequest } from '@chaindesk/lib/types/index';
import {
  MembershipRole,
  Prisma,
  PrismaClient,
  SubscriptionPlan,
  Usage,
  User,
} from '@chaindesk/prisma';
import { prisma } from '@chaindesk/prisma/client';

import { AnalyticsEvents, capture, profile } from './analytics-server';
import getRequestLocation from './get-request-location';
import getRootDomain from './get-root-domain';
import sendVerificationRequest from './verification-sender';
import { log } from 'node:console';

// const FacebookBusinessProvider = (options: OAuthUserConfig<any>): OAuthConfig<any> => {
//   return {
//     id: "facebook-business",
//     name: "Facebook Business",
//     type: "oauth",
//     version: "2.0",
//     authorization: {
//       url: "https://www.facebook.com/v17.0/dialog/oauth",
//       params: {
//         response_type: "code",
//         prompt: "consent",
//         config_id: process.env.FACEBOOK_CLIENT_CONFIG_ID!,
//         override_default_response_type: true,
//       }
//     },
//     accessTokenUrl: "https://graph.facebook.com/v17.0/oauth/access_token",
//     profileUrl: "https://graph.facebook.com/me",
//     clientId: process.env.FACEBOOK_CLIENT_ID!,
//     clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,

//     // Profile extraction
//     async profile(profile: any) {
//       return {
//         id: profile.id,
//         name: profile.name,
//         email: profile.email,
//       };
//     },
//   };
// };
const CustomPrismaProvider = (req: NextApiRequest) => (p: PrismaClient) => {
  return {
    ...PrismaAdapter(p),
    debug: true,
    createSession: async (data: Prisma.SessionCreateArgs['data']) => {
      const membership = await p.membership.findFirst({
        where: {
          userId: data.userId,
        },
      });

      return p.session.create({
        data: {
          ...data,
          organizationId: membership?.organizationId as string,
        } as Prisma.SessionCreateArgs['data'],
      });
    },
    createUser: async (data: Prisma.UserCreateArgs['data']) => {
      let product = undefined as string | undefined;
      try {
        product = new URL(req.query.callbackUrl as string)?.searchParams?.get(
          'product'
        ) as string;
      } catch (err) { }

      const user = await p.user.create({
        data: {
          ...data,
          ...(product ? { viaProduct: product } : {}),
          memberships: {
            create: {
              role: 'OWNER',
              organization: {
                create: {
                  name: generateFunId(),
                  apiKeys: {
                    create: {
                      key: uuidv4(),
                    },
                  },
                  usage: {
                    create: {},
                  },
                },
              },
            },
          },
        },
      });

      capture({
        event: AnalyticsEvents.USER_SIGNUP,
        payload: {
          userId: user.id,
        },
      });

      profile({
        userId: user.id,
        email: user.email,
        createdAt: user.createdAt,
        firstName: user.name!,
        plan: SubscriptionPlan.level_0,
        product: user.viaProduct,
      });

      return user;
    },
    async getSessionAndUser(sessionToken: string) {
      const userAndSession = await p.session.findUnique({
        where: { sessionToken },
        include: {
          user: {
            include: {
              ...sessionUserInclude,
            },
          },
          organization: {
            include: {
              ...sessionOrganizationInclude,
            },
          },
        },
      });
      if (!userAndSession) return null;
      const { user, ...session } = userAndSession;
      return {
        user: {
          ...user,
          sessionId: session.id,
          organization: session.organization,
        },
        session,
      };
    },
  };
};

export const authOptions = (req: NextApiRequest): AuthOptions => {
  const hostname = req.headers.host;
  const rootDomain = getRootDomain(hostname!);

  return {
    debug: true,
    adapter: CustomPrismaProvider(req)(prisma) as any,
    cookies: {
      sessionToken: {
        name:
          process.env.NODE_ENV === 'production'
            ? `__Secure-next-auth.session-token`
            : `next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          domain: hostname?.includes('localhost:3000')
            ? undefined
            : `.${rootDomain}`,
          secure: process.env.NODE_ENV === 'production' ? true : false,
        },
      },
    },
    providers: [
      EmailProvider({
        server: {
          host: process.env.EMAIL_SERVER_HOST,
          port: 465,
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
        },
        sendVerificationRequest: sendVerificationRequest,
        from: process.env.EMAIL_FROM,
      }),
      GithubProvider({
        clientId: process.env.GITHUB_ID!,
        clientSecret: process.env.GITHUB_SECRET!,
      }),
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        authorization: {
          params: {
            prompt: 'consent',
            access_type: 'offline',
            response_type: 'code',
          },
        },
      }),
      AzureADProvider({
        clientId: process.env.AZURE_AD_CLIENT_ID!,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
        tenantId: process.env.AZURE_AD_TENANT_ID!,
        authorization: {
          params: {
            scope: 'openid profile email'
          }
        }
      }),
      FacebookProvider({
        clientId: process.env.FACEBOOK_CLIENT_ID!,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
        authorization: {
          params: {
            scope: 'public_profile,email,business_management',
          },
        },
      })
      // Reemplaza o agrega el proveedor de Facebook Business personalizado
      // FacebookBusinessProvider({
      //   clientId: process.env.FACEBOOK_CLIENT_ID!,
      //   clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      // }),
    ],
    pages: {
      verifyRequest: '/auth/verify-request',
      error: '/auth/error',
      signIn: '/auth/signin',
    },
    callbacks: {
      async signIn({ user, account, profile }) {
        try {
          if (account?.provider === "azure-ad") {
            const existingUser = await prisma.user.findUnique({
              where: {
                email: user.email ?? undefined
              },
              include: {
                accounts: true,
                memberships: true
              }
            });

            if (existingUser) {
              // Si el usuario existe pero no tiene cuenta de Azure AD vinculada
              const userAccounts = await prisma.account.findMany({
                where: {
                  userId: existingUser.id,
                  provider: "azure-ad"
                }
              });

              if (userAccounts.length === 0) {
                // Vincular la cuenta de Azure AD al usuario existente
                await prisma.account.create({
                  data: {
                    userId: existingUser.id,
                    type: account.type,
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                    refresh_token: account.refresh_token,
                    access_token: account.access_token,
                    expires_at: account.expires_at,
                    token_type: account.token_type,
                    scope: account.scope,
                    id_token: account.id_token,
                  },
                });
              }
            }
          }
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email ?? undefined },
            include: {
              accounts: true,
              memberships: true,
            },
          });
          if (existingUser && account) {
            // Verifica si el usuario ya tiene una cuenta con el proveedor actual
            const userAccounts = await prisma.account.findMany({
              where: {
                userId: existingUser.id,
                provider: account.provider,
              },
            });

            if (userAccounts.length === 0) {
              // Si el usuario ya existe pero no tiene la cuenta vinculada, la creamos
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                },
              });
            }
          }
          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false;
        }
      },

      async session(props) {
        const { session, trigger, newSession, token } = props;
        const user = props.user as AdapterUser &
          Prisma.UserGetPayload<{ include: typeof sessionUserInclude }> & {
            sessionId: string;
            organization: Prisma.OrganizationGetPayload<{
              include: typeof sessionOrganizationInclude;
            }>;
          };

        try {
          let organization = user?.organization;

          const found = user?.memberships?.find(
            (one) => one.organizationId === organization?.id
          );

          const handleUpdateOrg = async (orgId: string) => {
            return prisma.session.update({
              where: {
                id: user?.sessionId,
              },
              data: {
                organization: {
                  connect: {
                    id: orgId,
                  },
                },
              },
              include: {
                organization: {
                  include: {
                    ...sessionOrganizationInclude,
                  },
                },
              },
            });
          };

          if (!found && user?.memberships?.length > 0) {
            // Usuario sin acceso a la organización actual, actualizar la sesión
            const defaultOrgId = user.memberships[0].organizationId;
            const updated = await handleUpdateOrg(defaultOrgId);
            organization = updated.organization!;
          } else if (trigger === 'update' && newSession?.orgId) {
            const foundNewOrg = user?.memberships?.find(
              (one) => one.organizationId === newSession.orgId
            );

            if (!foundNewOrg) {
              throw new Error('Unauthorized');
            }

            const updated = await handleUpdateOrg(newSession.orgId);
            organization = updated.organization!;
          }

          const roles = [
            user?.memberships?.find(
              (one) => one.organizationId === organization?.id
            )?.role,
            user?.role,
          ].filter(Boolean); // Eliminar valores undefined

          return {
            authType: 'session',
            ...session,
            roles,
            organization: organization ? {
              ...organization,
              ...formatOrganizationSession(organization),
            } : null,
            user: {
              ...session.user,
              ...formatUserSession(user),
            },
          };
        } catch (error) {
          console.error("Error in session callback:", error);
          return {
            ...session,
            error: "Error en la sesión",
          };
        }
      },

      async jwt({ token, user, account }) {
        if (account && user) {
          if (account.provider === "azure-ad") {
            token.accessToken = account.access_token;
            token.idToken = account.id_token;
          }
          token.userId = (user as any)?.id;
          token.roles = [
            (user as any)?.memberships?.find(
              (one: any) => one.organizationId === token.organizationId
            )?.role,
            (user as any)?.role,
          ].filter(Boolean);
        }
        return token;
      }
    },
  };
};

export const sessionUserInclude: Prisma.UserInclude = {
  usage: true,
  subscriptions: {
    where: {
      status: {
        in: ['active', 'trialing'],
      },
    },
  },
  memberships: {
    include: {
      organization: {
        include: {
          usage: true,
        },
      },
    },
  },
  _count: {
    select: {
      agents: {
        where: {
          hidden: false,
        },
      },
      datastores: true,
    },
  },
};

export const sessionOrganizationInclude: Prisma.OrganizationInclude = {
  usage: true,
  subscriptions: {
    where: {
      status: {
        in: ['active', 'trialing'],
      },
    },
  },
  _count: {
    select: {
      agents: {
        where: {
          hidden: false,
        },
      },
      datastores: true,
    },
  },
};

export const formatUserSession = (
  user: Prisma.UserGetPayload<{ include: typeof sessionUserInclude }>
) => {
  const subscriptions = Array.isArray(user?.subscriptions)
    ? user.subscriptions
    : [];

  return {
    ...user,
    customPicture: user?.customPicture || user?.picture,
    memberships: user?.memberships || [],
    usage: user?.usage as Usage,
    nbAgents: user?.['_count']?.agents as number,
    nbDatastores: user?.['_count']?.datastores as number,
    id: user.id,
    currentPlan:
      subscriptions[0]?.plan ||
      (SubscriptionPlan.level_0 as SubscriptionPlan),
    isPremium: subscriptions.length > 0,
    customerId: subscriptions[0]?.customerId || null,
  };
};

export const formatOrganizationSession = (
  organization: Prisma.OrganizationGetPayload<{
    include: typeof sessionOrganizationInclude;
  }>
) => {
  return {
    ...organization,
    usage: organization?.usage as Usage,
    nbAgents: organization?.['_count']?.agents as number,
    nbDatastores: organization?.['_count']?.datastores as number,
    currentPlan:
      organization?.subscriptions?.[0]?.plan ||
      (SubscriptionPlan.level_0 as SubscriptionPlan),
    isPremium: Number(organization?.subscriptions?.length) > 0,
    customerId: organization?.subscriptions?.[0]?.customerId as string,
  };
};

const handleGetSession = async (
  req: AppNextApiRequest,
  res: NextApiResponse
) => {
  const authHeader = req.headers.authorization;
  const apiKey = authHeader && authHeader.split(' ')?.[1];
  let session: Session | null = null;

  if (apiKey) {
    const key = await prisma.userApiKey.findUnique({
      where: {
        key: apiKey,
      },
      include: {
        user: {
          include: sessionUserInclude,
        },
        organization: {
          include: sessionOrganizationInclude,
        },
      },
    });

    if (key?.organization) {
      session = {
        authType: 'apiKey',
        user: undefined,
        roles: [MembershipRole.OWNER],
        organization: formatOrganizationSession(key.organization!),
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toDateString(),
      };
    }
  } else {
    session = await getServerSession(req, res, authOptions(req));
  }

  return session;
};

const auth: Middleware<AppNextApiRequest, NextApiResponse> = async (
  req,
  res,
  next
) => {
  const session = await handleGetSession(req, res);

  if (!session) {
    return res.status(403).end('Forbidden');
  }

  req.session = session;

  return next();
};
export const optionalAuth: Middleware<
  AppNextApiRequest,
  NextApiResponse
> = async (req, res, next) => {
  const session = await handleGetSession(req, res);

  if (session) {
    req.session = session;
  }

  return next();
};

export const withLogger: Middleware<
  AppNextApiRequest,
  NextApiResponse
> = async (req, res, next) => {
  if (!req.requestId) {
    req.requestId = uuidv4();
  }

  req.logger = logger.child({
    requestId: req.requestId,
    requestPath: req.url,
    requestIP: requestIp.getClientIp(req),
    requestCountry: getRequestLocation(req).country ?? 'en',
  });

  req.logger.info(req.method);

  // res.on('close', () => {
  //   req.logger.info('end');
  // });

  return next();
};

export default auth;
