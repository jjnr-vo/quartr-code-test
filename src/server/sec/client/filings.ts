import { Filing } from "@/shared/types";
import { OPTIONAL, REQUIRED } from "../../constants";
import {
  isValidDate,
  throwInvalidPayload,
  validateObjectValue,
  validateText,
} from "../../utils";

function getFilingDocumentUrl({
  accessionNumber,
  cik,
  path,
}: {
  accessionNumber: string;
  cik: string;
  path: string[];
}) {
  return `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accessionNumber.replaceAll("-", "")}/${path.map(encodeURIComponent).join("/")}`;
}

export function normalizeFilings(value: unknown, cik: string): Filing[] {
  const columns = validateObjectValue(value, "filing columns");
  const required: `${REQUIRED}`[] = Object.values(REQUIRED);
  const optional: `${OPTIONAL}`[] = Object.values(OPTIONAL);
  const arrays: Record<string, unknown[]> = {};

  for (const key of required) {
    const column = columns[key];
    if (!Array.isArray(column)) throwInvalidPayload(`missing ${key} column`);
    arrays[key] = column;
  }

  for (const key of optional) {
    const column = columns[key];
    if (column !== undefined) {
      if (!Array.isArray(column)) throwInvalidPayload(`${key} column`);
      arrays[key] = column;
    }
  }

  const length = arrays.accessionNumber.length;
  for (const [key, column] of Object.entries(arrays)) {
    if (column.length !== length)
      throwInvalidPayload(`inconsistent ${key} column length`);
  }

  return Array.from({ length }, (_, index) => {
    const accessionNumber = validateText(
      arrays.accessionNumber[index],
      "accession number",
    );
    const filingDate = validateText(arrays.filingDate![index], "filing date");
    const form = validateText(arrays.form![index], "form");
    const primaryDocument =
      validateText(arrays.primaryDocument![index], "primary document") || null;
    const reportDate = arrays.reportDate
      ? validateText(arrays.reportDate[index], "report date") || null
      : null;
    const description = arrays.primaryDocDescription
      ? validateText(
          arrays.primaryDocDescription[index],
          "document description",
        ) || null
      : null;
    if (
      !/^\d{10}-\d{2}-\d{6}$/.test(accessionNumber) ||
      !isValidDate(filingDate) ||
      !form
    ) {
      throwInvalidPayload("filing identity or date");
    }
    if (reportDate && !isValidDate(reportDate))
      throwInvalidPayload("report date");
    const path = primaryDocument?.split("/");
    if (
      path?.some(
        (part) => !part || part === "." || part === ".." || part.includes("\\"),
      )
    ) {
      throwInvalidPayload("primary document path");
    }
    return {
      accessionNumber,
      filingDate,
      form,
      reportDate,
      primaryDocument,
      description,
      documentUrl: path
        ? getFilingDocumentUrl({ accessionNumber, cik, path })
        : null,
    };
  });
}
