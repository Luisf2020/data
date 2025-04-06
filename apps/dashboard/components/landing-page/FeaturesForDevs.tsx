import {
  CloudArrowUpIcon,
  HeartIcon,
  LockClosedIcon,
  ServerIcon,
} from '@heroicons/react/20/solid';

const features = [
  {
    name: 'Fácil de Usar',
    description:
      'Nuestra plataforma sin código te permite crear y administrar tus chatbots de IA con facilidad, incluso sin conocimientos técnicos.',
    icon: HeartIcon,
  },
  {
    name: 'Integraciones de Datos, APIs',
    description:
      'Crea agentes LLM altamente integrados que se conectan a datos y APIs, abriendo un mundo de posibilidades para aplicaciones ilimitadas.',
    icon: ServerIcon,
  },
  {
    name: 'Integraciones Sin Problemas',
    description:
      'Integra tu chatbot de IA en Slack, Whatsapp y otras plataformas con facilidad, y comienza a interactuar con tu audiencia en los canales que prefieren.',
    icon: CloudArrowUpIcon,
  },
];

export default function Example() {
  return (
    <div className="py-24 overflow-hidden bg-black sm:py-32">
      <div className="px-6 mx-auto max-w-7xl lg:px-8">
        <div className="grid max-w-2xl grid-cols-1 mx-auto gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
          <div className="lg:pr-8 lg:pt-4">
            <div className="lg:max-w-lg">
              <h2 className="text-base font-bold leading-7 text-indigo-400">
                Para Creadores
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Experimenta Nuestra Plataforma Sin Código
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Con nuestra plataforma sin código, puedes crear un chatbot de IA
                personalizado entrenado con tus datos en segundos. Usa
                ChatsappAIAPI para consultar a tu agente o para realizar
                recuperación de documentos
              </p>
              <dl className="max-w-xl mt-10 space-y-8 text-base leading-7 text-gray-300 lg:max-w-none">
                {features.map((feature) => (
                  <div key={feature.name} className="relative pl-9">
                    <dt className="inline font-semibold text-white">
                      <feature.icon
                        className="absolute w-5 h-5 text-indigo-500 left-1 top-1"
                        aria-hidden="true"
                      />
                      {feature.name}
                    </dt>{' '}
                    <dd className="inline">{feature.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <img
            src="/landing-page/screenshot.png"
            alt="Product screenshot"
            className="w-[48rem] max-w-none rounded-xl shadow-xl ring-1 ring-white/10 sm:w-[57rem] md:-ml-4 lg:-ml-0"
            width={2432}
            height={1442}
          />
        </div>
      </div>
    </div>
  );
}
