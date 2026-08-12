import { useState } from "react";
import { Building2, Minus, Plus, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CompanyContact, CompanyMaster, saveCompany } from "@/lib/api/companies";

const field = "h-[30px] rounded-none border-[#D7DEE8] bg-white px-2 text-[13px] shadow-sm";
const selectField = "h-[30px] rounded-none border-[#D7DEE8] bg-white px-2 text-[13px] shadow-sm";
const invalidField = "border-red-500 bg-red-50";
const label = "self-center text-[13px] font-medium text-[#395982]";
const sectionTitle = "mb-2 flex items-center gap-2 text-[13px] font-semibold uppercase text-[#395982]";
const fontClass = "font-['Segoe_UI',Tahoma,Arial,sans-serif] text-[13px]";

const blankAddress = { countryName: "Korea (South)", province: "", postCode: "", city: "", detail: "" };
const blankContact: CompanyContact = {
  fullName: "",
  division: "",
  title: "",
  phoneCountryCode: "+82",
  phone: "",
  mobileCountryCode: "+82",
  mobilePhone: "",
  faxCountryCode: "+82",
  fax: "",
  email: "",
  instantMessengerType: "Skype",
  instantMessenger: "",
  remark: "",
  address: blankAddress,
};

const emptyCompany: CompanyMaster = {
  companyName: "Netpas",
  alias: "",
  businessType: "Bunker (Supplier, Broker and etc)",
  countryName: "Korea (South)",
  timeZone: "GMT +09:00",
  phoneCountryCode: "+82",
  phone: "6469-4566",
  faxCountryCode: "+82",
  fax: "324-9408",
  website: "www.netpas.net",
  bankAccount: "1081-600-391597",
  remark: "WOORI BANK Jamsil Station Branch",
  address: blankAddress,
  contact: blankContact,
  contacts: [blankContact],
};

function SimpleSelect({
  value,
  items,
  onChange,
  className = "",
}: {
  value?: string | null;
  items: string[];
  onChange?: (value: string) => void;
  className?: string;
}) {
  return (
    <Select value={value ?? ""} onValueChange={onChange}>
      <SelectTrigger className={`${selectField} ${className}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item} value={item} className={fontClass}>
            {item}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type FormErrors = Record<string, string>;

const textPattern = /^[\p{L}\p{N}\s.,'()&/+:-]*$/u;
const phonePattern = /^[0-9][0-9\s().-]{2,29}$/;
const phoneCodePattern = /^\+\d{1,4}$/;
const postCodePattern = /^[A-Za-z0-9\s-]{2,20}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?$/i;

function errorClass(errors: FormErrors, key: string) {
  return errors[key] ? invalidField : "";
}

function Row({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[128px_444px] gap-2">
      <Label className={label}>{name}</Label>
      {children}
    </div>
  );
}

function IconButtons({ onAdd, onRemove }: { onAdd: () => void; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-4">
      <button type="button" className="grid h-6 w-6 place-items-center text-emerald-600" onClick={onAdd}>
        <Plus className="h-4 w-4" />
      </button>
      <button type="button" className="grid h-6 w-6 place-items-center text-red-600" onClick={onRemove}>
        <Minus className="h-4 w-4" />
      </button>
    </div>
  );
}

export function AddressBookForm() {
  const [company, setCompany] = useState<CompanyMaster>(emptyCompany);
  const [contacts, setContacts] = useState<CompanyContact[]>([blankContact]);
  const [activeContact, setActiveContact] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState("");

  const update = <Key extends keyof CompanyMaster>(key: Key, value: CompanyMaster[Key]) => {
    setCompany((prev) => ({ ...prev, [key]: value }));
  };

  const updateCompanyAddress = (key: string, value: string) => {
    setCompany((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }));
  };

  const updateContact = (key: keyof CompanyContact, value: string) => {
    setContacts((prev) =>
      prev.map((contact, index) => (index === activeContact ? { ...contact, [key]: value } : contact)),
    );
  };

  const updateContactAddress = (key: string, value: string) => {
    setContacts((prev) =>
      prev.map((contact, index) =>
        index === activeContact
          ? { ...contact, address: { ...contact.address, [key]: value } }
          : contact,
      ),
    );
  };

  const addContact = () => {
    setContacts((prev) => [...prev, { ...blankContact, address: { ...blankAddress } }]);
    setActiveContact(contacts.length);
  };

  const removeContact = () => {
    setContacts((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, index) => index !== activeContact);
      setActiveContact(Math.max(0, activeContact - 1));
      return next;
    });
  };

  const handleSave = async () => {
    const payload = mapAddressBookPayload(company, contacts);
    const nextErrors = validateAddressBook(payload);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setMessage(Object.values(nextErrors)[0] ?? "Invalid input");
      return;
    }

    const saved = await saveCompany(payload);
    setCompany({ ...emptyCompany, ...saved });
    setContacts(saved.contacts?.length ? saved.contacts : [saved.contact ?? blankContact]);
    setActiveContact(0);
    setErrors({});
    setMessage("Saved");
  };

  const handleCancel = () => {
    if (window.history.length > 1) window.history.back();
  };

  const contact = contacts[activeContact] ?? blankContact;

  return (
    <Card className={`mx-auto w-[1228px] rounded-none border-border/80 shadow-sm ${fontClass}`}>
      <CardHeader className="h-6 border-b border-[#0F4E68] bg-[#155B78] px-2 py-0 text-white">
        <CardTitle className="flex h-full items-center gap-1.5 text-[11px] font-bold leading-none text-white">
          <Building2 className="h-3.5 w-3.5 text-white" />
          Company Detail {company.id ? `[${company.companyName}]` : "[New]"}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-6">
        <div className="grid grid-cols-[580px_580px] gap-8">
          <section className="w-[580px]">
            <div className={sectionTitle}>
              <Building2 className="h-4 w-4" />
              Company
            </div>
            <div className="space-y-[5px]">
              <div className="grid grid-cols-[128px_170px_70px_188px] gap-2">
                <Label className={label}>Company ID</Label>
                <Input className={field} value={company.id ?? ""} readOnly />
                <Label className={label}>Alias</Label>
                <Input className={`${field} ${errorClass(errors, "alias")}`} value={company.alias ?? ""} onChange={(event) => update("alias", event.target.value)} />
              </div>
              <Row name="Company (Account)">
                <Input className={`${field} ${errorClass(errors, "companyName")}`} value={company.companyName} onChange={(event) => update("companyName", event.target.value)} />
              </Row>
              <Row name="Alternative name">
                <Input className={field} />
              </Row>
              <Row name="Business Type">
                <SimpleSelect value={company.businessType} items={["Bunker (Supplier, Broker and etc)", "Owner", "Charterer", "Agent"]} onChange={(value) => update("businessType", value)} className={errorClass(errors, "businessType")} />
              </Row>
              <div className="grid grid-cols-[128px_170px_70px_188px] gap-2">
                <Label className={label}>Country</Label>
                <SimpleSelect value={company.countryName} items={["Korea (South)", "Japan", "Vietnam"]} onChange={(value) => update("countryName", value)} className={errorClass(errors, "countryName")} />
                <Label className={label}>Time Zone</Label>
                <SimpleSelect value={company.timeZone} items={["GMT +09:00", "GMT +07:00", "GMT +00:00"]} onChange={(value) => update("timeZone", value)} className={errorClass(errors, "timeZone")} />
              </div>
              <div className="grid grid-cols-[128px_170px_70px_188px] gap-2">
                <Label className={label}>Province</Label>
                <Input className={field} value={company.address?.province ?? ""} onChange={(event) => updateCompanyAddress("province", event.target.value)} />
                <Label className={label}>Post Code</Label>
                <Input className={`${field} ${errorClass(errors, "companyPostCode")}`} value={company.address?.postCode ?? ""} onChange={(event) => updateCompanyAddress("postCode", event.target.value)} />
              </div>
              <Row name="City">
                <Input className={field} value={company.address?.city ?? ""} onChange={(event) => updateCompanyAddress("city", event.target.value)} />
              </Row>
              <Row name="Detail">
                <Input className={field} value={company.address?.detail ?? ""} onChange={(event) => updateCompanyAddress("detail", event.target.value)} />
              </Row>
              <PhoneRow name="Phone" code={company.phoneCountryCode} value={company.phone} onCodeChange={(value) => update("phoneCountryCode", value)} onValueChange={(value) => update("phone", value)} />
              <PhoneRow name="Fax" code={company.faxCountryCode} value={company.fax} onCodeChange={(value) => update("faxCountryCode", value)} onValueChange={(value) => update("fax", value)} />
              <Row name="Web Site">
                <Input className={`${field} ${errorClass(errors, "website")}`} value={company.website ?? ""} onChange={(event) => update("website", event.target.value)} />
              </Row>
              <Row name="Social fage">
                <Input className={`${field} ${errorClass(errors, "socialPage")}`} value={company.bankAccount ?? ""} onChange={(event) => update("bankAccount", event.target.value)} />
              </Row>
              <Row name="Remark">
                <Textarea className="min-h-[76px] rounded-none border-[#D7DEE8] bg-white px-2 py-1 text-[13px] shadow-sm" value={company.remark ?? ""} onChange={(event) => update("remark", event.target.value)} />
              </Row>
            </div>
          </section>

          <section className="w-[580px]">
            <div className={sectionTitle}>
              <UserRound className="h-4 w-4" />
              Contact Person
            </div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-8 items-end gap-1 bg-[#EEF2F6] p-1">
                {contacts.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`h-7 border px-3 text-[13px] font-semibold ${index === activeContact ? "border-[#D7DEE8] bg-white shadow-sm" : "border-transparent bg-transparent"}`}
                    onClick={() => setActiveContact(index)}
                  >
                    Contact {index + 1}
                  </button>
                ))}
              </div>
              <IconButtons onAdd={addContact} onRemove={removeContact} />
            </div>
            <div className="space-y-[5px]">
              <Row name="Name">
                <Input className={`${field} ${errorClass(errors, `contacts.${activeContact}.fullName`)}`} value={contact.fullName ?? ""} onChange={(event) => updateContact("fullName", event.target.value)} />
              </Row>
              <Row name="Division">
                <Input className={field} value={contact.division ?? ""} onChange={(event) => updateContact("division", event.target.value)} />
              </Row>
              <Row name="Title">
                <Input className={field} value={contact.title ?? ""} onChange={(event) => updateContact("title", event.target.value)} />
              </Row>
              <Row name="Country">
                <SimpleSelect value={contact.address?.countryName} items={["Korea (South)", "Japan", "Vietnam"]} onChange={(value) => updateContactAddress("countryName", value)} />
              </Row>
              <div className="grid grid-cols-[128px_170px_70px_188px] gap-2">
                <Label className={label}>Province</Label>
                <Input className={field} value={contact.address?.province ?? ""} onChange={(event) => updateContactAddress("province", event.target.value)} />
                <Label className={label}>Post Code</Label>
                <Input className={`${field} ${errorClass(errors, `contacts.${activeContact}.postCode`)}`} value={contact.address?.postCode ?? ""} onChange={(event) => updateContactAddress("postCode", event.target.value)} />
              </div>
              <Row name="City">
                <Input className={field} value={contact.address?.city ?? ""} onChange={(event) => updateContactAddress("city", event.target.value)} />
              </Row>
              <Row name="Detail">
                <Input className={field} value={contact.address?.detail ?? ""} onChange={(event) => updateContactAddress("detail", event.target.value)} />
              </Row>
              <PhoneRow name="Phone" code={contact.phoneCountryCode} value={contact.phone} onCodeChange={(value) => updateContact("phoneCountryCode", value)} onValueChange={(value) => updateContact("phone", value)} />
              <PhoneRow name="Mobile Phone" code={contact.mobileCountryCode} value={contact.mobilePhone} onCodeChange={(value) => updateContact("mobileCountryCode", value)} onValueChange={(value) => updateContact("mobilePhone", value)} />
              <PhoneRow name="Fax" code={contact.faxCountryCode} value={contact.fax} onCodeChange={(value) => updateContact("faxCountryCode", value)} onValueChange={(value) => updateContact("fax", value)} />
              <Row name="E-mail">
                <Input className={`${field} ${errorClass(errors, `contacts.${activeContact}.email`)}`} value={contact.email ?? ""} onChange={(event) => updateContact("email", event.target.value)} />
              </Row>
              <div className="grid grid-cols-[128px_156px_280px] gap-2">
                <Label className={label}>Instant Messenger</Label>
                <SimpleSelect value={contact.instantMessengerType} items={["Skype", "WhatsApp"]} onChange={(value) => updateContact("instantMessengerType", value)} />
                <Input className={field} value={contact.instantMessenger ?? ""} onChange={(event) => updateContact("instantMessenger", event.target.value)} />
              </div>
              <Row name="Remark">
                <Textarea className="min-h-[64px] rounded-none border-[#D7DEE8] bg-white px-2 py-1 text-[13px] shadow-sm" value={contact.remark ?? ""} onChange={(event) => updateContact("remark", event.target.value)} />
              </Row>
              <div className="flex justify-end">
                <Button variant="outline" className="h-9 w-[200px] rounded-none border-[#D7DEE8] bg-white text-[13px] font-semibold text-black shadow-sm">
                  Move to other company
                </Button>
              </div>
            </div>
          </section>
        </div>
      </CardContent>
      <div className="flex justify-end gap-2 border-t border-[#D7DEE8] px-9 py-3">
        <div className="mr-auto self-center text-[12px] text-red-600">{message}</div>
        <Button variant="outline" className="h-9 w-[120px] rounded-none border-[#D7DEE8] bg-white text-[13px] font-semibold text-black shadow-sm" onClick={handleSave}>
          OK
        </Button>
        <Button variant="outline" className="h-9 w-[120px] rounded-none border-[#D7DEE8] bg-white text-[13px] font-semibold text-black shadow-sm" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}

function PhoneRow({
  name,
  code,
  value,
  onCodeChange,
  onValueChange,
}: {
  name: string;
  code?: string | null;
  value?: string | null;
  onCodeChange: (value: string) => void;
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-[128px_72px_364px] gap-2">
      <Label className={label}>{name}</Label>
      <SimpleSelect value={code} items={["+82", "+81", "+84", "+1"]} onChange={onCodeChange} />
      <Input className={field} value={value ?? ""} onChange={(event) => onValueChange(event.target.value)} />
    </div>
  );
}

function mapAddressBookPayload(company: CompanyMaster, contacts: CompanyContact[]): CompanyMaster {
  const cleanContacts = contacts.map((contact) => ({
    ...contact,
    address: {
      label: "Address",
      countryName: contact.address?.countryName,
      province: contact.address?.province,
      postCode: contact.address?.postCode,
      city: contact.address?.city,
      detail: contact.address?.detail,
    },
  }));

  return {
    ...company,
    address: {
      label: "Address",
      countryName: company.countryName,
      province: company.address?.province,
      postCode: company.address?.postCode,
      city: company.address?.city,
      detail: company.address?.detail,
    },
    contact: cleanContacts[0],
    contacts: cleanContacts,
  };
}

function validateAddressBook(company: CompanyMaster) {
  const next: FormErrors = {};
  requireText(next, "companyName", company.companyName, "Company (Account) is required.");
  optionalText(next, "alias", company.alias, "Alias contains unsupported characters.");
  requireText(next, "businessType", company.businessType, "Business Type is required.");
  requireText(next, "countryName", company.countryName, "Country is required.");
  requireText(next, "timeZone", company.timeZone, "Time Zone is required.");
  optionalPostCode(next, "companyPostCode", company.address?.postCode, "Company Post Code format is invalid.");
  optionalPhone(next, "phone", company.phoneCountryCode, company.phone, "Company Phone format is invalid.");
  optionalPhone(next, "fax", company.faxCountryCode, company.fax, "Company Fax format is invalid.");
  optionalUrl(next, "website", company.website, "Web Site format is invalid.");
  optionalUrl(next, "socialPage", company.bankAccount, "Social fage format is invalid.");

  company.contacts?.forEach((contact, index) => {
    const hasContact = Boolean(
      value(contact.fullName) ||
        value(contact.division) ||
        value(contact.title) ||
        value(contact.phone) ||
        value(contact.mobilePhone) ||
        value(contact.fax) ||
        value(contact.email) ||
        value(contact.instantMessenger),
    );
    if (!hasContact) return;
    requireText(next, `contacts.${index}.fullName`, contact.fullName, `Contact ${index + 1} Name is required.`);
    optionalPostCode(next, `contacts.${index}.postCode`, contact.address?.postCode, `Contact ${index + 1} Post Code format is invalid.`);
    optionalPhone(next, `contacts.${index}.phone`, contact.phoneCountryCode, contact.phone, `Contact ${index + 1} Phone format is invalid.`);
    optionalPhone(next, `contacts.${index}.mobilePhone`, contact.mobileCountryCode, contact.mobilePhone, `Contact ${index + 1} Mobile Phone format is invalid.`);
    optionalPhone(next, `contacts.${index}.fax`, contact.faxCountryCode, contact.fax, `Contact ${index + 1} Fax format is invalid.`);
    if (value(contact.email) && !emailPattern.test(value(contact.email))) {
      next[`contacts.${index}.email`] = `Contact ${index + 1} E-mail format is invalid.`;
    }
  });

  return next;
}

function requireText(errors: FormErrors, key: string, input: string | null | undefined, message: string) {
  const clean = value(input);
  if (!clean || !textPattern.test(clean)) errors[key] = message;
}

function optionalText(errors: FormErrors, key: string, input: string | null | undefined, message: string) {
  const clean = value(input);
  if (clean && !textPattern.test(clean)) errors[key] = message;
}

function optionalPostCode(errors: FormErrors, key: string, input: string | null | undefined, message: string) {
  const clean = value(input);
  if (clean && !postCodePattern.test(clean)) errors[key] = message;
}

function optionalPhone(
  errors: FormErrors,
  key: string,
  code: string | null | undefined,
  phone: string | null | undefined,
  message: string,
) {
  const cleanPhone = value(phone);
  const cleanCode = value(code);
  if (!cleanPhone) return;
  if (!phonePattern.test(cleanPhone) || !phoneCodePattern.test(cleanCode)) errors[key] = message;
}

function optionalUrl(errors: FormErrors, key: string, input: string | null | undefined, message: string) {
  const clean = value(input);
  if (clean && !urlPattern.test(clean)) errors[key] = message;
}

function value(input: string | null | undefined) {
  return input?.trim() ?? "";
}
