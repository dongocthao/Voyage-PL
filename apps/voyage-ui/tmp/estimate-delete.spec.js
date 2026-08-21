import { test, expect } from "@playwright/test";
import {
  cloneVoyageEstimate,
  createOperationForEstimate,
  deleteEstimate,
  deleteOperation,
} from "./test-helpers.js";

test.setTimeout(60000);

test("estimate delete succeeds when unlinked and is blocked when an operation exists", async ({
  request,
}) => {
  const estimateA = await cloneVoyageEstimate(request, "1");
  const estimateB = await cloneVoyageEstimate(request, "1");
  let operationId;

  try {
    const operation = await createOperationForEstimate(request, estimateB.estimateId, estimateB.snapshot);
    operationId = operation.operationId;

    const deleteFreeEstimate = await deleteEstimate(request, estimateA.estimateId);
    expect(deleteFreeEstimate.ok()).toBeTruthy();
    await expect(deleteFreeEstimate.json()).resolves.toMatchObject({
      estimateId: estimateA.estimateId,
      deleted: true,
    });

    const deleteLinkedEstimate = await deleteEstimate(request, estimateB.estimateId);
    expect(deleteLinkedEstimate.status()).toBe(400);
    await expect(deleteLinkedEstimate.json()).resolves.toMatchObject({
      code: "BUSINESS_RULE_VIOLATION",
    });
  } finally {
    if (operationId) {
      await deleteOperation(request, operationId);
    }
    await deleteEstimate(request, estimateB.estimateId).catch(() => undefined);
    await deleteEstimate(request, estimateA.estimateId).catch(() => undefined);
  }
});
