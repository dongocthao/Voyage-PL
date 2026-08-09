# Estimation Field Mapping Draft

This is a review draft for mapping the current Voyage P&L estimation UI to the PostgreSQL schema.

Legend:

- `Master -> UI`: data loaded from master/reference tables when opening or initializing a form.
- `UI -> Snapshot`: data written from the form/grid into estimate snapshot/result tables when saving a sheet.
- `Calculated`: value should be recalculated from current sheet data, then optionally cached.
- `Decided`: confirmed by user and ready for implementation.

## 1. Shared Sheet Header And Vessel Block

Applies to: Voyage Estimation, Time Charter Estimation, Cargo Relet Estimation.

### 1.1 Sheet Metadata

| UI field | Master -> UI | UI -> Snapshot | Notes |
|---|---|---|---|
| Sheet tab name, e.g. `voyage1` | none | `estimates.sheet_name` | Generated from sheet type and sequence. |
| Sheet order | none | `estimates.sheet_order` | Tab order inside one estimate file. |
| Estimate type | UI enum/list | `estimates.estimate_type` | Decided: UI Est Type codes like `TCOV`, `OVOV`, `RELT` map into `estimate_type`. |
| Estimate status | none/default | `estimates.status` | Default `DRAFT`; later `CONFIRMED`, `FIXED`, `LOST`, `CANCELLED`. |
| Currency | default/config | `estimates.currency` | Default `USD`. |
| SUEZ/PANAMA/KIEL checkboxes | none/default | `estimates.routing_suez`, `routing_panama`, `routing_kiel` | Current UI shows these per Port Rotation. |
| Operator | `users.full_name` / `users.username` | `estimates.operator_user_id` | UI displays name; DB stores user id. |
| Operation dept | `departments` | `estimates.operation_dept_id` | Not visible in current Voyage header but present in schema/workflow. |
| Remark | none | `estimates.remark` | Decided: all Remark buttons in the 3 Estimation forms open one common estimate remark popup. |
| Voyage No | none | `estimates.voyage_no` | Decided: store as real column. |
| Open position | `ports.port_name` or free coordinate | first `estimate_port_legs` row | Decided: store only as first Port Rotation leg. |

### 1.2 Vessel Particulars

| UI field | Master -> UI | UI -> Snapshot | Notes |
|---|---|---|---|
| MV | `vessels.mv_name` | `estimate_vessels.mv_name`, `estimate_vessels.vessel_id` | On vessel selection, copy into snapshot. |
| DWT | `vessels.dwt` | `estimate_vessels.dwt` | Snapshot protects old estimates from later master edits. |
| Draft (M) | `vessels.draft_m` | `estimate_vessels.draft_m` |  |
| TPC | `vessels.tpc` | `estimate_vessels.tpc` |  |
| Built | `vessels.built_year` | `estimate_vessels.built_year` |  |
| Kind | `vessel_kinds.name/code` via `vessels.vessel_kind_id` | `estimate_vessels.vessel_kind_id` | UI currently shows blank/sample. |
| Vessel Type | `vessel_types.name/code` via `vessels.vessel_type_id` | `estimate_vessels.vessel_type_id` | Present in master; not always visible in compact header. |
| Selected bunker profile | `vessel_bunker_profiles` | `estimate_vessels.bunker_profile_id` | Choose active profile by estimate/open date unless user overrides. |

### 1.3 Speed And Bunker Consumption Snapshot

| UI field/grid | Master -> UI | UI -> Snapshot | Notes |
|---|---|---|---|
| Speed mode | `vessel_performance_modes.mode` | `estimate_vessels.mode` | UI values Full/Eco/Custom map to enum `FULL/ECO/CUSTOM1...`. |
| Speed Ballast | `vessel_performance_modes.speed_ballast_kn` | `estimate_vessels.speed_ballast_kn` | Editable in yellow cells in UI, but starts from master. |
| Speed Laden | `vessel_performance_modes.speed_laden_kn` | `estimate_vessels.speed_laden_kn` | Editable in yellow cells in UI, but starts from master. |
| Main Normal fuel type | `vessel_bunker_consumption` + `fuel_types` where role `MAIN`, condition `NORMAL` | `estimate_vessel_bunker` | Store one row per role/condition/activity/fuel type. |
| Main ECA fuel type | same, condition `ECA` | `estimate_vessel_bunker` |  |
| Main Ballast/Laden/Idle/Work consumption | `vessel_bunker_consumption.consumption_mt_day` | `estimate_vessel_bunker.consumption_mt_day` | Activities `BALLAST`, `LADEN`, `IDLE`, `WORK`. |
| Sub Normal/ECA fuel type | `vessel_bunker_consumption` + `fuel_types` where role `SUB` | `estimate_vessel_bunker` |  |
| Sub Sea/Idle/Work consumption | `vessel_bunker_consumption.consumption_mt_day` | `estimate_vessel_bunker.consumption_mt_day` | Activities `SEA`, `IDLE`, `WORK`. |

## 2. Voyage Estimation

### 2.1 Cargo Grid

| UI column | Master -> UI | UI -> Snapshot | Notes |
|---|---|---|---|
| # | none | `estimate_cargo_lines.line_no` | Sequence per estimate. |
| Account | `companies.company_name` filtered by business type | `estimate_cargo_lines.account_company_id` | UI text should resolve to company id. |
| Cargo Name | `cargoes.cargo_name` | `estimate_cargo_lines.cargo_id`, `cargo_name` snapshot | Decided: Cargo Master is required for Loadable Quantity stowage factor. |
| Loading Port | `ports.port_name`, country/timezone display from `countries`, `utc_offset_min` | `estimate_cargo_lines.loading_port_id` | Store id, display rich label. |
| Discharging Port | `ports` | `estimate_cargo_lines.discharging_port_id` |  |
| Quantity | none / Loadable Quantity Calculator | `estimate_cargo_lines.quantity_mt` |  |
| Unit | unit list | `estimate_cargo_lines.quantity_unit` | Decided: quantity can be non-MT; column appears after Quantity in Voyage and Cargo Relet cargo grids. |
| Freight - Frt | none / Freight Simulator | `estimate_cargo_freight_terms.freight_rate` where `cp_side=HEAD` |  |
| Freight - Term | `cp_terms.code` | `estimate_cargo_freight_terms.freight_term_id` |  |
| Frt Type | enum `F/L` | `estimate_cargo_freight_terms.freight_type` | Decided: `F` = rate, `L` = lumpsum. |
| Frt Lumpsum | manual | `estimate_cargo_freight_terms.freight_lumpsum` | Decided: freight amount when type is `L`. |
| Total Freight | calculated | `estimate_cargo_freight_terms.total_freight` | Cache: rate x quantity or lumpsum. |
| A. Comm | none | `estimate_cargo_freight_terms.add_comm_pct` | Decided: manual input. |
| Brkg | none | `estimate_cargo_freight_terms.brokerage_pct` | Decided: manual input. |
| Frt Tax | none | `estimate_cargo_freight_terms.freight_tax_pct` | Percent. |
| Liner Term | none | `estimate_cargo_freight_terms.liner_cost_amount` | Decided: cost amount. |
| Search/action icon | none | none | UI action only. |

### 2.2 Port Rotation Grid

| UI column | Master -> UI | UI -> Snapshot | Notes |
|---|---|---|---|
| # | none | `estimate_port_legs.leg_no` | Sequence per estimate. |
| Type | enum/list | `estimate_port_legs.leg_type` | Map UI `Dischg.` to DB `DISCHARGE`; `Ballast`, `Loading`, `Canal`, `Bunker`. |
| Port Name / Coordinate | `ports` | `estimate_port_legs.port_id` | Free coordinate can remain a later enhancement. |
| Distance TTL | route/analyzer/manual | `estimate_port_legs.distance_nm` |  |
| Distance ECA | route/analyzer/manual | `estimate_port_legs.eca_nm` |  |
| WF | none/default | `estimate_port_legs.wf_pct` | Decided: applies to whole leg distance, including ECA. |
| Spd | vessel speed snapshot / user override | `estimate_port_legs.speed_kn` | Usually ballast/laden speed depending leg state. |
| Sea | calculated | `estimate_port_legs.sea_days` | Cache per leg. |
| L/D Rate | cargo/laytime terms/manual | `estimate_port_leg_cp_terms.ld_rate` where `cp_side=HEAD` | For Voyage only HEAD side. |
| Port Idle | manual | `estimate_port_legs.port_idle_days` | Includes normal idle and margin row idle. |
| Working | calculated | derived only | Decided: always derive per leg; no snapshot column. |
| Dem | calculated total revenue | `estimate_port_leg_cp_terms.demurrage` | Decided: total Dem is revenue and is added into Revenue. |
| Des | calculated total expense | `estimate_port_leg_cp_terms.despatch` | Decided: total Des is expense and shown in Operation Expense. |
| Port Charge | manual | `estimate_port_legs.port_charge` | Includes canal toll for canal rows unless separate expense is required. |
| Arrival | calculated/manual override | `estimate_port_legs.arrival_at` |  |
| Departure | first row manual, others calculated/manual override | `estimate_port_legs.departure_at` | First row is open date/time. |
| Margin row Sea | manual | `estimates.margin_sea_days` | Decided: separate field. |
| Margin row Idle | manual | `estimates.margin_port_idle_days` | Decided: separate field. |
| Time unit selector Days/Hours | none | `estimates.time_display_unit` | Decided: persist UI preference. |
| Port local/UTC selector | `ports.utc_offset_min` | `estimates.timezone_display_mode` | Decided: persist UI preference. |

### 2.3 Operation Expense Panel

| UI label | Master -> UI | UI -> Snapshot | Notes |
|---|---|---|---|
| Dem/Des | calculated from port CP terms | `estimate_expense_items` category `DEM_DES` suggested, or only result calculation | Current seed lacks `DEM_DES`; schema category can support it. |
| Add Comm. | calculated from freight terms | `estimate_expense_items` category `ADD_COMM` or calculated only | Usually calculated, not user-entered. |
| Brokerage | calculated | `estimate_expense_items` category `BROKERAGE` or calculated only |  |
| Freight Tax | calculated/input | `estimate_expense_items` category `FREIGHT_TAX` or calculated only |  |
| Liner Terms | calculated/input | `estimate_expense_items` category `LINER_TERMS` | Decided: cost amount. |
| Port Charge | sum from port legs | result calculation / optional `estimate_expense_items` category `PORT_CHARGE` | Prefer derive from legs. |
| Bunker Expense | sum from bunker summary | result calculation / optional expense item | Prefer derive from `estimate_bunker_summary`. |
| C.E.V. | manual | `estimate_expense_items` category `CVE` | Seed uses `CVE`; UI label has dots. |
| ILOHC | manual | `estimate_expense_items` category `ILOHC` |  |
| Ballast Bonus | manual income | `estimate_expense_items` category `BALLAST_BONUS`, `flow=INCOME` |  |
| Routing Service | manual | `estimate_expense_items` category `ROUTING_SERVICE` | Decided. |
| Others | manual | `estimate_expense_items` category `OTHER` |  |

### 2.4 Bunker Expense Panel

| UI column | Master -> UI | UI -> Snapshot | Notes |
|---|---|---|---|
| Fuel type | `fuel_types.code` | `estimate_bunker_summary.fuel_type_id` | VLSFO/MGO/ULSFO etc. |
| Price / MT | bunker index/manual/simulator | `estimate_bunker_summary.price_per_mt` |  |
| Consumption | calculated from duration x vessel consumption snapshot | `estimate_bunker_summary.consumption_mt` | Cache. |
| Expense | calculated | `estimate_bunker_summary.expense` | Cache. |
| Bunker Simulator ROB/supply details | existing leg/fuel | `estimate_bunker_opening_rob`, `estimate_leg_bunker_rob` | Use if simulator is applied. |

### 2.5 Result Panel

| UI field | Source | UI -> Snapshot | Notes |
|---|---|---|---|
| Hire / Day | manual | `estimates.hire_day` | Decided: dedicated column. |
| H/Add Comm. | manual | `estimates.hire_add_comm_pct` | Decided: dedicated column. |
| Net Hire | calculated | derived from `estimates.hire_day` and `hire_add_comm_pct` | Decided formula; no separate source input. |
| C/Base | calculated | derived on load | Decided formula; report does not need extra cache. |
| Revenue | calculated | `estimate_results.revenue` |  |
| Op. Expense | calculated | `estimate_results.op_expense` |  |
| Op. Profit | calculated | `estimate_results.op_profit` |  |
| Total Hire | calculated | `estimate_results.total_hire` |  |
| Total Expense | calculated | derived or cached in result payload | `op_expense + total_hire`. |
| Profit (USD) | calculated | `estimate_results.profit_usd` |  |
| TCE | calculated | `estimate_results.tce_usd_day` | Not visible in current Voyage panel mock but in workflow. |
| Profit Rate | calculated | `estimate_results.profit_rate_pct` | Not visible in current Voyage panel mock. |
| Daily revenue/expense/profit | calculated | `estimate_results.daily_revenue`, `daily_expense`, `daily_profit` |  |

## 3. Time Charter Estimation

### 3.1 Head CP / Sub CP Tables

| UI column | Master -> UI | UI -> Snapshot | Notes |
|---|---|---|---|
| Account | `companies.company_name` | `estimate_charter_terms.account_company_id` | One row per `cp_side`: HEAD/SUB. |
| Delivery Port | `ports` | `estimate_charter_terms.delivery_port_id` |  |
| Redelivery Port | `ports` | `estimate_charter_terms.redelivery_port_id` |  |
| Duration | manual/calculated from delivery-redelivery | `estimate_charter_terms.duration_days` | If multi duration on, total comes from period rows. |
| Daily Hire | manual | `estimate_charter_terms.daily_hire` |  |
| Gross Hire | calculated | `estimate_charter_terms.gross_hire` | Cache. |
| Add com | manual | `estimate_charter_terms.add_comm_pct` |  |
| Brkg | manual | `estimate_charter_terms.brokerage_pct` |  |
| Use Multi Duration | UI checkbox | `estimate_charter_terms.use_multi_duration` |  |
| Multi Duration rows | none | `estimate_charter_duration_periods.period_no`, `duration_days`, `daily_hire` | Decided: periods apply sequentially by elapsed duration. |

### 3.2 Time Charter Port Rotation

| UI column | Master -> UI | UI -> Snapshot | Notes |
|---|---|---|---|
| # | none | `estimate_port_legs.leg_no` | Same table as Voyage. |
| Type | enum/list | `estimate_port_legs.leg_type` | Decided: add DB enum value `OTHER`. |
| Port Name or Coordinates | `ports` | `estimate_port_legs.port_id` |  |
| Distance TTL/ECA | route/manual | `distance_nm`, `eca_nm` |  |
| W.F | default/manual | `wf_pct` |  |
| Spd | vessel speed snapshot | `speed_kn` |  |
| Sea | calculated | `sea_days` |  |
| Port Idle | manual | `port_idle_days` |  |
| Arrival | calculated | `arrival_at` | Delivery/redelivery special labels are UI placeholders. |
| Departure | manual/calculated | `departure_at` | Redelivery departure = delivery datetime + duration per workflow. |
| Margin row | manual | `estimates.margin_sea_days`, `estimates.margin_port_idle_days` | Decided: separate fields. |

### 3.3 Time Charter Bottom Panels

| UI grid/field | Source | UI -> Snapshot | Notes |
|---|---|---|---|
| Hire table: Daily Gross/Net, Total Gross, Add Comm, Brokerage, Total Net by Head/Sub/Diff | calculated from `estimate_charter_terms` | `estimate_results` side HEAD/SUB/DIFF, plus derived values | Save final result cache; do not save every intermediate row by default. |
| Operation: Ballast Bonus, ILOHC, C.E.V., Bunker Expense by Head/Sub/Diff | manual/calculated | `estimate_expense_items` with `cp_side`, `estimate_bunker_summary`, `estimate_results` |  |
| Bunker Expense: fuel, price, consumption, expense | `fuel_types` + calculated | `estimate_bunker_summary` | TC scope to be finalized with calculation workflow. |
| Others: Income, Expense | manual | `estimate_misc_voyage_revenue_items`, `estimate_misc_operation_expense_items` plus categories `OTHER_INCOME` / `OTHER` | Decided: save detail rows. |
| Result rows | calculated | `estimate_results` | Use HEAD/SUB/DIFF where comparison is shown; use TOTAL for single-side totals. |

## 4. Cargo Relet Estimation

### 4.1 Cargo Grid

| UI column | Master -> UI | UI -> Snapshot | Notes |
|---|---|---|---|
| # | none | `estimate_cargo_lines.line_no` |  |
| Account | `companies` | `estimate_cargo_lines.account_company_id` | Account is shared cargo account unless later split is requested. |
| Cargo Name | `cargoes.cargo_name` | `estimate_cargo_lines.cargo_id`, `cargo_name` snapshot | Decided: same Cargo Master as Voyage. |
| Loading Port | `ports` | `estimate_cargo_lines.loading_port_id` |  |
| Discharging Port | `ports` | `estimate_cargo_lines.discharging_port_id` |  |
| Quantity | none/calculator | `estimate_cargo_lines.quantity_mt` |  |
| Unit | unit list | `estimate_cargo_lines.quantity_unit` | Decided: quantity can be non-MT. |
| HEAD CP Frt | none/simulator | `estimate_cargo_freight_terms.freight_rate`, `cp_side=HEAD` |  |
| HEAD CP A. Comm | none | `add_comm_pct`, `cp_side=HEAD` | Decided: manual input. |
| HEAD CP Brkg | none | `brokerage_pct`, `cp_side=HEAD` | Decided: manual input. |
| HEAD CP Net Frt | calculated | `net_freight`, `cp_side=HEAD` |  |
| HEAD CP Frt Type | enum `F/L` | `freight_type`, `cp_side=HEAD` | Decided. |
| HEAD CP Frt Lumpsum | manual | `freight_lumpsum`, `cp_side=HEAD` | Decided. |
| HEAD CP Liner Terms | none | `liner_cost_amount`, `cp_side=HEAD` | Decided: cost amount. |
| SUB CP Frt | none/simulator | `estimate_cargo_freight_terms.freight_rate`, `cp_side=SUB` |  |
| SUB CP A. Comm | none | `add_comm_pct`, `cp_side=SUB` | Decided: manual input. |
| SUB CP Net Frt | calculated | `net_freight`, `cp_side=SUB` |  |
| SUB CP Frt Type | enum `F/L` | `freight_type`, `cp_side=SUB` | Decided. |
| SUB CP Frt Lumpsum | manual | `freight_lumpsum`, `cp_side=SUB` | Decided. |
| SUB CP Liner Terms | none | `liner_cost_amount`, `cp_side=SUB` | Decided: cost amount. |
| SUB CP Brkg | none | `brokerage_pct`, `cp_side=SUB` | Decided: manual input. |

### 4.2 Cargo Relet Port Rotation

| UI column | Master -> UI | UI -> Snapshot | Notes |
|---|---|---|---|
| Shared columns: #, Type, Port, Distance TTL/ECA, WF, Spd, Sea | `ports`, vessel snapshot | `estimate_port_legs` | Same as Voyage. |
| HEAD CP L/D Rate | manual | `estimate_port_leg_cp_terms.ld_rate`, `cp_side=HEAD` |  |
| HEAD CP Dem/Des | manual/calculated | `demurrage`, `despatch`, `cp_side=HEAD` |  |
| SUB CP L/D Rate | manual | `ld_rate`, `cp_side=SUB` |  |
| SUB CP Dem/Des | manual/calculated | `demurrage`, `despatch`, `cp_side=SUB` |  |
| Port Idle / Working | manual/calculated | `estimate_port_legs.port_idle_days`; working derived | Decided: working days are derived, not cached. |
| Port Charge | manual | `estimate_port_legs.port_charge` | Decided: paid by Sub-side. |
| Arrival / Departure | calculated/manual | `arrival_at`, `departure_at` |  |

### 4.3 Cargo Relet Bottom Panels

| UI field | Source | UI -> Snapshot | Notes |
|---|---|---|---|
| Operation Expense | calculated/manual | `estimate_expense_items`, `estimate_results` | Cargo Relet excludes bunker and port cost by default; Dem/Des Head/Sub are calculated separately. |
| Head CP Freight | calculated | `estimate_results.total_freight` side HEAD |  |
| Sub CP Freight | calculated | `estimate_results.total_freight` side SUB |  |
| Head CP Net | calculated | `estimate_results.revenue` side HEAD |  |
| Sub CP Net | calculated | `estimate_results.revenue` side SUB or result payload net freight field | Treat as Sub-side net freight/revenue, not operation expense. |
| Op. Expense | calculated | `estimate_results.op_expense` |  |
| Days / Net Voyage Days | calculated | `estimate_results.total_duration_days` |  |
| TCE / Day | calculated | `estimate_results.tce_usd_day` |  |
| Profit (USD) | calculated | `estimate_results.profit_usd` side `DIFF` | Decided. |

## 5. Supporting Modal Tools

These tools can feed values into the active estimate, but should not necessarily own the saved source of truth.

| Tool | Main UI fields | Master -> UI | UI -> Snapshot |
|---|---|---|---|
| Loadable Quantity Calculator | vessel particulars, draft/TPC/constant/cargo quantity result | `vessels`, `estimate_vessels` | Writes chosen result into `estimate_cargo_lines.quantity_mt`; details save to `estimate_calculation_history`. |
| Freight Simulator | target profit/TCE/freight sensitivity | current estimate rows/results | Writes chosen freight into `estimate_cargo_freight_terms`; details save to `estimate_calculation_history`. |
| Bunker Simulator | opening ROB, leg ROB/supply, weighted prices, consumption | fuel types, estimate port legs | `estimate_bunker_opening_rob`, `estimate_leg_bunker_rob`, `estimate_bunker_summary`. |
| Analyzer | sensitivity by freight/hire/quantity/bunker | current estimate result | Decided: details save to `estimate_calculation_history`. |

## 6. Master Data Forms Feeding Estimation

| Master form/component | DB tables | Feeds UI fields |
|---|---|---|
| New Vessel - General/Particulars | `vessels`, `vessel_gears`, `vessel_kinds`, `vessel_types`, `companies` owner | Vessel selector, vessel header snapshot, loadable quantity calculator. |
| New Vessel - Speed/Bunker tabs | `vessel_bunker_profiles`, `vessel_performance_modes`, `vessel_bunker_consumption`, `fuel_types` | Speed block, fuel main/sub tables, bunker consumption calculation. |
| Address Book / Company Detail | `companies`, `company_business_types`, `company_aliases`, `contact_persons`, `addresses`, `contact_channels`, `business_types`, `im_types`, `countries` | Cargo account, CP account, owner, bunker supplier/broker/agent lookups. |
| Port master | `ports`, `countries`, `port_types` | Loading/discharging port, open position, delivery/redelivery, port rotation, timezone display. |
| Cargo master | `cargoes` | Cargo selector, default unit, stowage factor for Loadable Quantity Calculator. |
| Terms master | `cp_terms`, `laytime_terms` | Freight term, liner term, L/D/laytime terms if exposed. |
| Expense category master | `expense_categories` | Operation Expense labels and Other income/expense rows. |

## 7. Calculation Rules Confirmed

### 7.1 Laden / Ballast Leg Classification

Port Rotation distance belongs to the leg from the previous port row to the current port row. The row type is the current port operation, not always the sea-state of the preceding leg.

Using the sample Port Rotation:

| Leg | Current row type | Distance | Classification | Reason |
|---|---:|---:|---|---|
| CJK -> Tianjin | Loading | 676 | Ballast | No cargo onboard before the first loading port. |
| Tianjin -> Qingdao | Loading | 463 | Laden | Cargo is onboard after Tianjin. |
| Qingdao -> Rizhao | Loading | 82 | Laden | Cargo remains onboard while moving between loading ports. |
| Rizhao -> Singapore | Bunker | 2,461 | Laden | Cargo remains onboard after last loading port. |
| Singapore -> Suez Canal | Canal | 5,047 | Laden | Cargo remains onboard through bunker/canal legs. |
| Suez Canal -> Ravenna | Dischg. | 1,356 | Laden | Cargo remains onboard until discharge completes. |
| Ravenna -> Rotterdam | Dischg. | 3,057 | Laden | Remaining cargo is still onboard before final discharge. |
| Rotterdam -> Rotterdam | Dischg. | 0 | Laden, zero distance | Final same-port discharge row has no sea time. |

Implementation rule: a leg is `BALLAST` until the first loading operation is reached. From the first loading port onward, legs are `LADEN` while any cargo remains onboard, including loading-to-loading, loading-to-bunker, canal, and discharge-to-discharge legs. After the final discharge, any following reposition leg becomes `BALLAST`.

When margin sea days exist, allocate them into ballast/laden sea-day totals proportionally to the actual ballast/laden sea days unless the UI later provides an explicit split. In the sample, actual sea days are 2.11 ballast and 38.96 laden; the 2.00 margin sea days are implicitly split into approximately 0.11 ballast and 1.89 laden, producing the displayed totals 2.22 ballast and 40.85 laden.

### 7.2 Weather Factor

Adjusted distance is:

```text
adjusted_distance = distance_nm * (1 + weather_factor)
sea_days = adjusted_distance / speed_knots / 24
```

The weather factor applies to the whole leg distance, including the ECA portion. ECA is recorded as a subset of the total distance for reporting/fuel-zone logic, not as a separate sea-day formula.

Sample checks:

| Leg distance | ECA | WF | Speed | Sea days |
|---:|---:|---:|---:|---:|
| 676 | 0 | 5.0% | 14.00 | 2.11 |
| 463 | 0 | 5.0% | 14.00 | 1.45 |
| 82 | 0 | 5.0% | 14.00 | 0.26 |
| 2,461 | 0 | 5.0% | 14.00 | 7.69 |
| 5,047 | 0 | 5.0% | 14.00 | 15.77 |
| 1,356 | 0 | 5.0% | 14.00 | 4.24 |
| 3,057 | 417 | 5.0% | 14.00 | 9.55 |

### 7.3 ECA Bunker Consumption

ECA days use the same ballast/laden speed as the parent sea leg. There is no separate ECA speed field.

For main engine fuel:

| Zone | Default fuel type | Speed source | Consumption-rate source |
|---|---|---|---|
| Non-ECA | VLSFO | Leg ballast/laden speed | Normal main-engine ballast/laden rate |
| ECA | ULSFO | Leg ballast/laden speed | ECA main-engine ballast/laden rate |

For sub engine fuel, the sample profile uses MGO for both Normal and ECA rows. Sub-engine sea consumption follows the applicable sea days and sub-engine `Sea` rate.

Implementation rule: split each sea leg into non-ECA distance and ECA distance using `distance_nm` and `eca_distance_nm`; calculate both portions with the same adjusted-distance and speed logic, then assign main-engine fuel type by zone. Non-ECA main consumption defaults to VLSFO, ECA main consumption uses ULSFO.

### 7.4 Freight Terms And Simulator Fixed Flag

Freight supports two calculation modes:

| Frt Type | Meaning | Freight amount rule |
|---|---|---|
| `F` | Freight rate | `freight_rate * quantity` |
| `L` | Lump sum freight | `freight_lumpsum` |

Liner Cost is a lump-sum cost amount entered manually by the user.

In the Freight Simulator, the `Fixed` checkbox means the selected cargo freight is locked during simulation:

| Fixed state | Simulator behavior |
|---|---|
| Unchecked | The cargo freight is a free variable. The simulator may increase/decrease this cargo freight to reach Target Profit. |
| Checked | The cargo freight is locked. The simulator excludes this cargo from freight adjustment and distributes changes only across unlocked cargo rows. |

Demurrage is revenue and is added to the Revenue total. Despatch is operation expense and is included in Operation Expense.

### 7.5 Voyage Estimation Hire / Fixed Expense

`Hire / Day` and `H/Add Comm.` are manual user inputs.

Calculated fields:

```text
Net Hire = Hire / Day * (1 - H/Add Comm.)
Total Hire = Net Hire * Total Duration
C/Base = (Op. Expense / Total Duration) + Net Hire - (Profit / Total Duration)
```

### 7.6 Cargo Relet Calculation Scope

Head CP and Sub CP share the same cargo quantity and the same Port Rotation. Port Rotation is not split into separate Head/Sub itineraries.

Demurrage and Despatch are calculated separately for Head CP and Sub CP.

Cargo Relet focuses on freight differential. Bunker cost and port cost are not included in Cargo Relet result calculation unless a later workflow explicitly adds an operation-cost scenario.

### 7.7 Time Charter Multi-Duration Hire

Time Charter hire periods are applied sequentially by elapsed duration.

Example:

| Period | Duration | Hire rate |
|---|---:|---:|
| Period 1 | First 80 days | 5,000 USD/day |
| Period 2 | Next 40 days | 7,000 USD/day |

For a 120-day contract, days 1-80 use 5,000 USD/day and days 81-120 use 7,000 USD/day.

If an option such as `15 days +/-` extends the actual period beyond 120 days, the extra days from day 121 onward use the adjacent/latest duration rate, i.e. 7,000 USD/day in this example. If actual duration is greater than 80 and less than 120, the days after day 80 still use the second-period rate, i.e. 7,000 USD/day.

### 7.8 Save Snapshot Policy

Preferred policy: save user-entered source data plus cached final results. Do not persist every calculated row/intermediate value by default.

Store:

| Data type | Save policy |
|---|---|
| User-entered form/grid values | Persist as source of truth. |
| Selected master-data references | Persist IDs plus necessary display snapshots where historical readability matters. |
| Final calculated result totals | Persist as cache for list/report performance and audit readability. |
| Generated details from Analyzer/Freight/Loadable tools | Persist to `estimate_calculation_history` when user applies or saves a tool run. |
| Generic intermediate calculated rows | Recalculate on load; do not persist by default. |
| UI preferences such as Days/Hours and Port local/UTC | Persist on `estimates`. |

There is no save-by-save version/history requirement at this stage.

Required master data before estimation can be reliable: vessel, bunker profile, port, company/account, CP terms, laytime terms, fuel type, and expense categories.

Cargo Master is also required. It provides cargo name, default unit, and stowage factor for Loadable Quantity calculation by cargo capacity.

## 8. Confirmed Schema Decisions

These decisions are confirmed and ready for implementation:

1. Est Type codes map into `estimate_type`.
2. `Voyage No` is stored as `estimates.voyage_no`.
3. Header `Open Position` is stored only as first Port Rotation leg.
4. Cargo `Unit` is stored as `estimate_cargo_lines.quantity_unit` and shown after Quantity.
5. `Liner Term` is a cost amount, stored as `estimate_cargo_freight_terms.liner_cost_amount`.
6. Margin sea days and margin port idle days are stored separately.
7. Port Rotation `Working` days are always derived, not cached.
8. Dem is revenue; Des is expense and appears in Operation Expense.
9. Voyage Estimation `Hire / Day` and `H/Add Comm.` use dedicated estimate columns.
10. Added expense categories and misc detail tables for operation expense and voyage revenue.
11. Time Charter `Others` maps to DB enum value `OTHER`.
12. Analyzer/Freight/Loadable calculation details save to `estimate_calculation_history`.
13. Cargo Relet `Profit (USD)` saves as `estimate_results.side=DIFF`.
14. Cargo Relet Sub CP includes Brokerage.
15. Cargo Relet Port Charge is paid by Sub-side.
16. Cargo tables include `Frt Type` and `Frt Lumpsum` between Term and Total Freight.
17. All Remark buttons in Voyage Estimation, Cargo Relet, and Time Charter Estimation use one common popup and save to `estimates.remark`.
18. Status workflow after `DRAFT` uses `CONFIRMED`, `FIXED`, `LOST`, and `CANCELLED`; users may change status manually for now, with no transition guard.
19. Cargo Master is required and stores stowage factor for Loadable Quantity calculations.
20. Default A.Comm and Brokerage are manual inputs, not defaulted from company/account for now.
21. UI preferences Days/Hours and Port local/UTC are persisted on the estimate.
22. Report does not require extra cache fields for derived values such as C/Base and Net Hire; calculate them again on load.
