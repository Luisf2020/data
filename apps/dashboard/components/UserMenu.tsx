import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { LogoutOutlined } from '@mui/icons-material';
import Avatar from '@mui/joy/Avatar';
import Divider from '@mui/joy/Divider';
import Dropdown from '@mui/joy/Dropdown';
import Menu from '@mui/joy/Menu';
import MenuButton from '@mui/joy/MenuButton';
import MenuItem from '@mui/joy/MenuItem';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import React from 'react';
import { IoDocumentText, IoSettings } from 'react-icons/io5';

import { RouteNames } from '@chaindesk/lib/types';
import AccountCard from './AccountCard';

type Props = {};

function UserMenu({ }: Props) {
  const { data: session } = useSession();

  const handleMenuClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.account-card-container')) {
      e.stopPropagation();
    }
  };

  return (
    <Stack
      direction="row"
      justifyContent={'space-between'}
      alignItems={'start'}
      gap={1}
    >
      <Dropdown>
        <MenuButton
          variant="plain"
          size={'sm'}
          sx={{
            flexDirection: 'row',
            display: 'flex',
            gap: 1,
            width: '100%',
            maxWidth: '100%',
          }}
          className="truncate"
          endDecorator={<ExpandMoreRoundedIcon />}
        >
          <Avatar
            size="sm"
            src={session?.user?.image!}
            sx={{
              ':hover': {
                cursor: 'pointer',
              },
            }}
          />

          <Typography
            className="truncate"
            sx={{ maxWidth: '100%', mr: 'auto' }}
            level="body-sm"
          >
            {session?.user?.name || session?.user?.email}
          </Typography>
        </MenuButton>
        <Menu
          onClick={handleMenuClick}
          sx={{
            maxHeight: '80vh',
            overflowY: 'auto',
            zIndex: 1200,
            position: 'fixed',
            '&.MuiMenu-root': {
              right: 'auto',
              left: '0',
            }
          }}
          placement="bottom-start"
        >
          <Link href={RouteNames.PROFILE}>
            <MenuItem>{session?.user?.email}</MenuItem>
          </Link>
          <Divider sx={{ my: 1 }} />
          <Link href={RouteNames.SETTINGS}>
            <MenuItem>
              <Stack direction="row" alignItems="center" gap={1}>
                <IoSettings style={{ fontSize: '18px' }} />
                <Typography>Configuración</Typography>
              </Stack>
            </MenuItem>
          </Link>
          <Divider sx={{ my: 1 }} />
          <Link href="https://docs.chatsappai.com/" target="blank">
            <MenuItem>
              <Stack direction="row" alignItems="center" gap={1}>
                <IoDocumentText style={{ fontSize: '18px' }} />
                <Typography>Documentación</Typography>
              </Stack>
            </MenuItem>
          </Link>
          <Divider />
          <div className='account-card-container p-2'>
            <AccountCard />
          </div>
          <MenuItem onClick={() => signOut()}>
            <LogoutOutlined sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>
      </Dropdown>
    </Stack>
  );
}

export default UserMenu;