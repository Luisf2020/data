export type ProductType = 'chatsappai' | 'cs' | 'chat' | 'blablaform';
import React, { useContext, useEffect } from 'react';
import { createContext } from 'react';

export const ProductContext = createContext('chatsappai' as ProductType);

export const getProductFromHostname = (hostname?: string): ProductType => {
  if (!hostname) {
    return 'chatsappai';
  }

  if (
    ['cs.chatsappai.com', 'cs.localhost', 'cs.localhost:3000'].includes(hostname)
  ) {
    return 'cs';
  } else if (
    ['chat.chatsappai.com', 'chat.localhost', 'chat.localhost:3000'].includes(
      hostname
    )
  ) {
    return 'chat';
  }
  // ['agents.localhost', 'localhost'].includes(window.location.hostname)
  else {
    return 'chatsappai';
  }
};

const useProduct = () => {
  const product = useContext(ProductContext);

  return {
    product,
  };
};

export default useProduct;
