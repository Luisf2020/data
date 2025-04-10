"use client"; // NextJS 13 requires this. Remove if you are using NextJS 12 or lower
import Script from "next/script";
import { useEffect } from "react";

const YourComponent = () => {
  useEffect(() => {
    const win = window as any;

    if (typeof win.Featurebase !== "function") {
      win.Featurebase = function () {
        // eslint-disable-next-line prefer-rest-params
        (win.Featurebase.q = win.Featurebase.q || []).push(arguments);
      };
    }
    win.Featurebase("initialize_feedback_widget", {
      organization: "chatsappaish",
      theme: "light",
      placement: "right",
      email: "youruser@example.com", // optional
      defaultBoard: "yourboardname", // optional - preselect a board
    })
  }, []);

  return (
    <>
      <Script src="https://do.featurebase.app/js/sdk.js" id="featurebase-sdk" />
      <div>
        {/*If you wish to open the widget using your own button you can do so here.
           To get rid of our floating button, remove 'placement' from the Featurebase('initialize_feedback_widget') call above.
          */}
        <button data-featurebase-feedback>Open Widget</button>
      </div>
    </>
  );
};

export default YourComponent;