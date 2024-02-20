export function bigIntToNumber(bg: BigInt) {
  return parseInt(bg.toString());
}

export const safeJsonParse =
  <T>(guard: (o: any) => o is T) =>
  (text: string): ParseResult<T> => {
    const parsed = JSON.parse(text);
    return guard(parsed) ? { parsed, hasError: false } : { hasError: true };
  };

export type ParseResult<T> =
  | { parsed: T; hasError: false; error?: undefined }
  | { parsed?: undefined; hasError: true; error?: unknown };

export function millisToDate(millis: number | undefined) {
  if (millis === undefined || isNaN(millis)) {
    return new Date();
  }
  return new Date(millis);
}

export const dateIsFromToday = (millis: number | undefined) => {
  if (millis === undefined) return true;
  else {
    const d = new Date(millis);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }
};

export function millisToInputDate(
  millis: number | undefined,
  offsetUTCInMillis: number
) {
  if (millis === undefined || isNaN(millis)) {
    return "";
  }
  const d = new Date(millis + offsetUTCInMillis);
  return d.toISOString().substring(0, 10);
}

export function millisToInputDateTime(
  millis: number | undefined,
  offsetUTCInMillis: number
) {
  if (millis === undefined || isNaN(millis)) {
    return "";
  }
  const d = new Date(millis + offsetUTCInMillis);
  //console.log(d.getTime(), d.toISOString().substring(0, 19));
  return d.toISOString().substring(0, 19);
}

export function millisToCurrentDate(
  millis: number | undefined,
  offsetUTCInMillis: number,
  returnType: "DATE_TIME" | "TIME_DATE" | "DATE" | "TIME",
  separator: string = " ",
  emptyTimeSTring: string = "-"
) {
  if (millis === undefined || millis === 0) return emptyTimeSTring;
  else {
    const d = new Date(millis + offsetUTCInMillis);
    //console.log("DATE: ", d.toISOString());
    switch (returnType) {
      case "DATE_TIME":
        return (
          d.toISOString().substring(0, 10) +
          separator +
          d.toISOString().substring(11, 23)
        );
      case "TIME_DATE":
        return (
          d.toISOString().substring(11, 23) +
          separator +
          d.toISOString().substring(0, 10)
        );
      case "TIME":
        return d.toISOString().substring(11, 23);
      default:
        return d.toISOString().substring(0, 10);
    }
  }
}
