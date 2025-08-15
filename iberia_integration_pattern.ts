import TransreportAccessLinkWidget from 'npm:@transreport/access-link-widget';

// Values you already know from the airline session/page:
const pnr = 'ABCD12';
const passenger = { givenName: 'Alex', familyName: 'Ng' };
const flight = { number: 'TR123', date: '2025-09-14' }; // ISO (YYYY-MM-DD) preferred

// 1) Instantiate the widget
const widget = new TransreportAccessLinkWidget({
  mount: '#accesslink-widget',
  locale: 'en',
  rounded: true,
  shadow: true,
  onBookingCreated: async (event) => {
    const accessLinkReferenceId = event.data.referenceId;
    const accessLinkUserId = event.data.userId;

    // 2) Immediately bind YOUR booking reference (PNR) to the AccessLink booking
    await widget.confirmBooking({
      accessLinkReferenceId,
      accessLinkUserId,
      confirmedId: pnr,        // <-- your PNR/booking reference
    });

    // 3) Persist extra context in YOUR system, keyed by the PNR
    await fetch('/api/accesslink/bind', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        pnr,
        passenger,
        flight,
        accessLinkReferenceId,
        accessLinkUserId,
      })
    });
  },
  onFailure: (e) => console.error('AccessLink error', e),
});

// 4) Load the widget
widget.load();
  