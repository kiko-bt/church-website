export type ChurchSettings = {
  readonly _id: string;
  readonly _type: "churchSettings";
  readonly churchName: string;
  readonly address: string;
  readonly email: string;
  readonly phone?: string;
  readonly facebook?: string;
  readonly youtube?: string;
  readonly serviceSchedule?: string;
};
