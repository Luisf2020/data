export const transcribeAudio = async (audioBlob: Blob) => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.wav');

  try {
    const response = await fetch(
      'https://voice-models-east-us2.openai.azure.com/openai/deployments/whisper/audio/transcriptions?api-version=2024-02-01',
      {
        method: 'POST',
        headers: {
          'api-key': 'b30df0ff4e7f44be87dc3f22222d67b2',
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Error en la transcripción');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Error transcribiendo audio:', error);
    throw error;
  }
};
