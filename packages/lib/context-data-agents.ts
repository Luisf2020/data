export const currentDatePrompt = () => {
  const currentDate = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',  // Día de la semana en letras
    day: 'numeric',   // Día del mes en número
    month: 'long',    // Mes en letras
    year: 'numeric',  // Año completo
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Cordoba',
  };
  const formattedDate = new Intl.DateTimeFormat('es-AR', options).format(currentDate);

  const prompt = `\n<DATE>\n###HORA ACTUAL\n\nEn esta sección encontrarás detallada la hora actual. Debes utilizar la hora actual cada vez que se solicite comunicar la hora al cliente o hacer cálculos en base a la fecha.\nLa hora actual es: ${formattedDate + ' (UTC-3)'}\n</DATE>`;
  return prompt;
}

export const currentPhoneNumberNamePrompt = (phone: string = 'Sin información', name: string = 'Sin información') => {
  const prompt = `\n<PHONE_AND_NAME>\n###NOMBRE Y NÚMERO DE TELÉFONO\n\nEn esta sección encontrarás detallado tanto el número de teléfono del cliente con el que estás hablando, así como también su nombre que aparece en WhatsApp. Debes tener en cuenta esta información y utilizar el nombre y el número de teléfono cuando sea requerido.\nNúmero de teléfono del cliente: ${phone}\nNombre del cliente que figura en WhatsApp: ${name}\n</PHONE_AND_NAME>`;
  return prompt;
}