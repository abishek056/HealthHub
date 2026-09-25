export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  BookAppointment: { hospitalId?: number; hospitalName?: string };
  AppointmentDetail: { appointmentId: string };
  RecordDetail: { recordId: string };
  HospitalList: undefined;
};

export type TabParamList = {
  Home: undefined;
  Appointments: undefined;
  Records: undefined;
  Profile: undefined;
};
