export function trackEvent ( eventName, eventData = {} )
{
    if ( !eventName )
        return;

    if ( !window.umami?.track )
        return;

    window.umami.track( eventName, eventData );
}
