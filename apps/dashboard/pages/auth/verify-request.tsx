import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';

import FeedbackCard from '@app/components/FeedbackCard';

function VerifyRequest() {
  return (
    <FeedbackCard
      Icon={<MarkEmailUnreadIcon />}
      header={'Revisa tu correo electrónico'}
      description={'Se ha enviado un enlace de inicio de sesión a tu dirección de correo electrónico.'}
    />
  );
}
export default VerifyRequest;
