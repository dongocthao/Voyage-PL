const API_BASE_URL = "http://127.0.0.1:3001/api";

export function uniqueSuffix(prefix = "test") {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function fetchJson(request, url) {
  const response = await request.get(url);
  if (!response.ok()) {
    throw new Error(`Request failed ${response.status()} for ${url}: ${await response.text()}`);
  }
  return response.json();
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

async function resolveByName(request, path, name, key = "name") {
  if (!name) return undefined;
  const items = await fetchJson(request, `${API_BASE_URL}${path}`);
  const wanted = normalize(name);
  const matched = items.find((item) => normalize(item[key]) === wanted);
  return matched?.id ? String(matched.id) : undefined;
}

export async function loadVoyageEstimateSnapshot(request, estimateId = "1") {
  return fetchJson(request, `${API_BASE_URL}/estimates/voyage-snapshots/${estimateId}`);
}

export async function cloneVoyageEstimate(request, sourceEstimateId = "1") {
  const source = await loadVoyageEstimateSnapshot(request, sourceEstimateId);
  const suffix = uniqueSuffix("estimate");
  const vesselId =
    source.header.vesselId ??
    (await resolveByName(request, "/master-data/vessels", source.header.vesselName));
  const cargoId = await resolveByName(request, "/master-data/cargoes", "bagged cement");
  const loadingPortId = await resolveByName(request, "/master-data/ports?q=Tianjin", "Tianjin");
  const dischargePortId = await resolveByName(
    request,
    "/master-data/ports?q=Ravenna",
    "Ravenna",
  );
  const accountCompanyId =
    (await resolveByName(request, "/master-data/companies", "Demo Charterer A")) ?? "1";

  const payload = {
    header: {
      fileName: `${suffix}.ves`,
      sheetName: suffix,
      estimateTypeCode: source.header.estimateTypeCode ?? "TCOV",
      voyageNo: `${source.header.voyageNo || "VOY"}-${suffix}`,
      remark: `Playwright ${suffix}`,
      vesselId,
      vesselName: source.header.vesselName || "Netpas Prosperity",
      performanceMode: source.header.performanceMode ?? "FULL",
      routingSuez: source.header.routingSuez ?? true,
      routingPanama: source.header.routingPanama ?? false,
      routingKiel: source.header.routingKiel ?? true,
      marginSeaDays: source.header.marginSeaDays ?? 0,
      marginPortIdleDays: source.header.marginPortIdleDays ?? 0,
      hireDay: source.header.hireDay ?? 18000,
      hireAddCommPct: source.header.hireAddCommPct ?? 3.75,
      timeDisplayUnit: source.header.timeDisplayUnit ?? "DAYS",
      timezoneDisplayMode: source.header.timezoneDisplayMode ?? "PORT_LOCAL",
    },
    cargoLines: [
      {
        lineNo: 1,
        accountCompanyId,
        accountCompanyName: "Demo Charterer A",
        cargoId,
        cargoName: "bagged cement",
        loadingPortId,
        loadingPortName: "Tianjin",
        dischargingPortId: dischargePortId,
        dischargingPortName: "Ravenna",
        quantity: 1000,
        unit: "MT",
        freight: {
          freightRate: 20,
          addCommPct: 1,
          brokeragePct: 1,
          freightTaxPct: 0,
          freightType: "F",
          linerCostAmount: 0,
          isFreightFixed: false,
        },
      },
    ],
    portLegs: [
      {
        legNo: 1,
        legType: "LOADING",
        portId: loadingPortId,
        portName: "Tianjin",
        distanceNm: 240,
        ecaNm: 24,
        wfPct: 10,
        speedKn: 10,
        seaDays: 1.1,
        portIdleDays: 1,
        portCharge: 1000,
        cpTerm: {
          ldRate: 1000,
          demurrage: 100,
          despatch: 50,
        },
      },
      {
        legNo: 2,
        legType: "DISCHARGE",
        portId: dischargePortId,
        portName: "Ravenna",
        distanceNm: 240,
        ecaNm: 24,
        wfPct: 0,
        speedKn: 10,
        seaDays: 1,
        portIdleDays: 1,
        portCharge: 1000,
        cpTerm: {
          ldRate: 1000,
          demurrage: 100,
          despatch: 50,
        },
      },
    ],
    bunkerProfile: source.bunkerProfile ?? [],
    operationExpenseItems: source.operationExpenseItems ?? [],
    miscOperationExpenseItems: source.miscOperationExpenseItems ?? [],
    miscVoyageRevenueItems: source.miscVoyageRevenueItems ?? [],
  };

  const response = await request.post(`${API_BASE_URL}/estimates/voyage-snapshots`, {
    data: payload,
  });
  if (!response.ok()) {
    throw new Error(`Failed to clone estimate: ${response.status()} ${await response.text()}`);
  }
  const body = await response.json();
  return {
    estimateId: body.estimateId,
    estimateFileId: body.estimateFileId,
    payload,
    snapshot: {
      header: payload.header,
      cargoLines: payload.cargoLines,
      portLegs: payload.portLegs,
      bunkerProfile: payload.bunkerProfile,
      operationExpenseItems: payload.operationExpenseItems,
      miscOperationExpenseItems: payload.miscOperationExpenseItems,
      miscVoyageRevenueItems: payload.miscVoyageRevenueItems,
    },
    suffix,
  };
}

export async function deleteEstimate(request, estimateId) {
  return request.delete(`${API_BASE_URL}/estimates/${estimateId}`);
}

export async function createOperationForEstimate(request, estimateId, snapshot) {
  const suffix = uniqueSuffix("op");
  const payload = {
    header: {
      estimateId,
      vesselId: snapshot.header.vesselId,
      vesselName: snapshot.header.vesselName || "Netpas Prosperity",
      voyageNo: `OP-${suffix}`,
      status: "ONGOING",
      currency: "USD",
    },
    cargoRows: [],
    portRows: [],
    bunkerRows: [],
    reports: [],
  };

  const response = await request.post(`${API_BASE_URL}/estimates/operation-snapshots`, {
    data: payload,
  });
  if (!response.ok()) {
    throw new Error(`Failed to create operation: ${response.status()} ${await response.text()}`);
  }
  return response.json();
}

export async function deleteOperation(request, operationId) {
  return request.delete(`${API_BASE_URL}/estimates/operation-snapshots/${operationId}`);
}

export async function findOperationByEstimate(request, estimateId) {
  const response = await request.get(
    `${API_BASE_URL}/estimates/operation-snapshots/by-estimate/${estimateId}`,
  );
  if (!response.ok()) {
    throw new Error(`Failed to find operation by estimate ${estimateId}: ${response.status()}`);
  }
  return response.json();
}

export async function listOperations(request) {
  const response = await request.get(`${API_BASE_URL}/estimates/operations`);
  if (!response.ok()) {
    throw new Error(`Failed to list operations: ${response.status()} ${await response.text()}`);
  }
  return response.json();
}
