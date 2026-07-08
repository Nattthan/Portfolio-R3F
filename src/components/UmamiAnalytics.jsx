import { useEffect } from "react";

const umamiScriptSrc = import.meta.env.VITE_UMAMI_SCRIPT_SRC;
const umamiWebsiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
const loaderAttribute = "portfolio-r3f";

export default function UmamiAnalytics ()
{
    useEffect( () =>
    {
        if ( !umamiScriptSrc || !umamiWebsiteId )
            return undefined;

        const existingScript = document.querySelector(
            `script[data-umami-loader="${ loaderAttribute }"]`
        );

        if ( existingScript )
            return undefined;

        const script = document.createElement( "script" );

        script.defer = true;
        script.src = umamiScriptSrc;
        script.dataset.websiteId = umamiWebsiteId;
        script.dataset.umamiLoader = loaderAttribute;

        document.head.appendChild( script );

        return () =>
        {
            script.remove();
        };
    }, [] );

    return null;
}
