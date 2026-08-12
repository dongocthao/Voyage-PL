const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

export type CompanyAddress = {
  label?: string | null;
  countryName?: string | null;
  province?: string | null;
  postCode?: string | null;
  city?: string | null;
  detail?: string | null;
};

export type CompanyContact = {
  fullName?: string | null;
  division?: string | null;
  title?: string | null;
  phoneCountryCode?: string | null;
  phone?: string | null;
  mobileCountryCode?: string | null;
  mobilePhone?: string | null;
  faxCountryCode?: string | null;
  fax?: string | null;
  email?: string | null;
  instantMessengerType?: string | null;
  instantMessenger?: string | null;
  remark?: string | null;
  address?: CompanyAddress;
};

export type CompanyMaster = {
  id?: string;
  companyName: string;
  alias?: string | null;
  businessType?: string | null;
  countryName?: string | null;
  timeZone?: string | null;
  phoneCountryCode?: string | null;
  phone?: string | null;
  faxCountryCode?: string | null;
  fax?: string | null;
  website?: string | null;
  bankAccount?: string | null;
  remark?: string | null;
  address?: CompanyAddress;
  contact?: CompanyContact;
  contacts?: CompanyContact[];
};

export type CompanyLookup = {
  id: string;
  name: string;
  country?: string | null;
  businessType?: string | null;
};

async function requestCompany(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new Error(body?.message ?? `Company request failed with status ${response.status}`);
  }
  return body as CompanyMaster;
}

export async function listCompanies(query = "") {
  const params = query ? `?q=${encodeURIComponent(query)}` : "";
  const response = await fetch(`${API_BASE_URL}/master-data/companies${params}`);
  const body = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new Error(body?.message ?? `Company lookup failed with status ${response.status}`);
  }
  return body as CompanyLookup[];
}

export function getCompany(id: string) {
  return requestCompany(`${API_BASE_URL}/master-data/companies/${encodeURIComponent(id)}`);
}

export function saveCompany(company: CompanyMaster) {
  const { id, ...payload } = sanitizeCompany(company);
  const method = id ? "PUT" : "POST";
  const url = id
    ? `${API_BASE_URL}/master-data/companies/${encodeURIComponent(id)}`
    : `${API_BASE_URL}/master-data/companies`;
  return requestCompany(url, { method, body: JSON.stringify(payload) });
}

function sanitizeCompany(company: CompanyMaster): CompanyMaster {
  return {
    ...company,
    companyName: company.companyName.trim(),
    alias: cleanString(company.alias),
    businessType: cleanString(company.businessType),
    countryName: cleanString(company.countryName),
    timeZone: cleanString(company.timeZone),
    phoneCountryCode: cleanString(company.phoneCountryCode),
    phone: cleanString(company.phone),
    faxCountryCode: cleanString(company.faxCountryCode),
    fax: cleanString(company.fax),
    website: cleanString(company.website),
    bankAccount: cleanString(company.bankAccount),
    remark: cleanString(company.remark),
    address: sanitizeAddress(company.address),
    contact: sanitizeContact(company.contact),
    contacts: company.contacts?.map(sanitizeContact).filter(Boolean) as CompanyContact[] | undefined,
  };
}

function sanitizeContact(contact?: CompanyContact): CompanyContact | undefined {
  if (!contact) return undefined;
  return {
    ...contact,
    fullName: cleanString(contact.fullName),
    division: cleanString(contact.division),
    title: cleanString(contact.title),
    phoneCountryCode: cleanString(contact.phoneCountryCode),
    phone: cleanString(contact.phone),
    mobileCountryCode: cleanString(contact.mobileCountryCode),
    mobilePhone: cleanString(contact.mobilePhone),
    faxCountryCode: cleanString(contact.faxCountryCode),
    fax: cleanString(contact.fax),
    email: cleanString(contact.email),
    instantMessengerType: cleanString(contact.instantMessengerType),
    instantMessenger: cleanString(contact.instantMessenger),
    remark: cleanString(contact.remark),
    address: sanitizeAddress(contact.address),
  };
}

function sanitizeAddress(address?: CompanyAddress): CompanyAddress | undefined {
  if (!address) return undefined;
  return {
    label: cleanString(address.label),
    countryName: cleanString(address.countryName),
    province: cleanString(address.province),
    postCode: cleanString(address.postCode),
    city: cleanString(address.city),
    detail: cleanString(address.detail),
  };
}

function cleanString(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
