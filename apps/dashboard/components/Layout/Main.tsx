import { Box, BoxProps } from '@mui/joy';

import UserMenu from '../UserMenu';

export default function Main(props: BoxProps) {
  return (
    <>
      <div className="fixed right-6 top-3 z-50">
        <UserMenu />
      </div>
      <Box
        component="main"
        className="Main"
        {...props}
        sx={[
          {
            pt: 1,
            px: 2,
          },
          ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
        ]}
      />
    </>
  );
}
