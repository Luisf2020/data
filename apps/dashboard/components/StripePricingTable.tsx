import Head from 'next/head';
import { useSession } from 'next-auth/react';
import React from 'react';

type Props = {};

function StripePricingTable({}: Props) {
  const { data: session, status } = useSession();
  console.log(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  return (
    <>
      <Head>
        <script
          id="stripe-pricing-table"
          async
          src="https://js.stripe.com/v3/pricing-table.js"
        ></script>
      </Head>
      <stripe-pricing-table
        pricing-table-id="prctbl_1PbuZIBZx6RIyNe11OZyJghK"
        publishable-key="pk_live_51NB0tjBZx6RIyNe1gSopgPVVIt4WL9fmIYY4gjnzK8I1vKe41FdeF3pYGqjUz2lEDYKRvMN4AJBi0biImu7ILzvt00qVJdffw6"
        client-reference-id={session?.organization?.id}
        customer-email={session?.user?.email}
      ></stripe-pricing-table>
    </>
  );
}

export default StripePricingTable;
