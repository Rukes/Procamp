export interface Translations {
  // Obecné
  back: string;
  next: string;
  total: string;
  required: string;
  optional: string;
  invalidEmail: string;
  paymentOnSite: string;
  mandatory: string;

  // Kroky (StepIndicator)
  stepType: string;
  stepDate: string;
  stepConfig: string;
  stepContact: string;

  // TypeStep
  typeTitle: string;
  typeSubtitle: string;
  typeNoTypes: string;
  typeSoldOut: string;
  typePerNight: string;
  typeNightSingle: (n: number) => string;
  typeNightRange: (from: number, to: number) => string;
  typeNightPlus: (from: number) => string;

  // DateStep
  dateTitle: string;
  dateSubtitle: string;
  dateNight: (n: number) => string;

  // ConfigStep
  configPersonsTitle: string;
  configAdults: string;
  configAdultsSub: string;
  configChildren: string;
  configChildrenSub: string;
  configSurchargesTitle: string;
  configMandatory: string;
  configPerNight: string;
  configNights: (n: number) => string;

  // ContactStep
  contactTitle: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
  contactLicensePlate: string;
  contactLicensePlatePlaceholder: string;
  contactArrival: string;
  contactArrivalUnknown: string;
  contactNote: string;
  contactSubmit: string;
  contactSubmitting: string;

  // ConfirmationStep
  confirmTitle: string;
  confirmTitlePending: string;
  confirmSubtitle: (name: string) => string;
  confirmSubtitlePending: (name: string) => string;
  confirmCheckIn: string;
  confirmCheckOut: string;
  confirmNights: string;
  confirmTotal: string;
  confirmFooter: string;
  confirmBookingCode: string;

  // Info modal
  campInfo: string;

  // Chyby
  errorNoAvailability: string;
  errorGeneral: string;
  errorFormNotFound: string;

  // SummaryStep
  summaryTitle: string;
  summaryType: string;
  summaryCheckIn: string;
  summaryCheckOut: string;
  summaryNights: string;
  summaryPersons: string;
  summaryAdults: (n: number) => string;
  summaryChildren: (n: number) => string;
}
