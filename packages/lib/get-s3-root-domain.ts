export default function getS3RootDomain() {
  // if (process.env.NEXT_PUBLIC_AWS_ENDPOINT) {
  //   return `${process.env.NEXT_PUBLIC_AWS_ENDPOINT}`;
  // }
  //return `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.amazonaws.com`;
  return `https://chatsappai-data.s3.amazonaws.com`;
}
