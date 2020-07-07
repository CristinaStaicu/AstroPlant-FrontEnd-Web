import { createReducer, ActionType } from "typesafe-actions";
import isEqual from "lodash/isEqual";
import * as actions from "./actions";
import { byId, arrayToObject } from "utils/byId";

import { Kit } from "astroplant-api";
import { KitConfiguration, Peripheral } from "astroplant-api";

export type KitConfigurationState = KitConfiguration & {
  peripherals: { [peripheralId: string]: Peripheral };
};

export interface Measurement {
  quantityType: number;
  value: number;
}

export interface RawMeasurement extends Measurement {
  kitSerial: string;
  peripheral: number;
  datetime: number;
}

export interface KitState {
  details: Kit | null;
  configurations: { [id: string]: KitConfigurationState } | null;
  loadingConfigurations: boolean;
  rawMeasurements: { [key: string]: RawMeasurement };
  status: "None" | "Fetching" | "NotFound" | "NotAuthorized" | "Fetched";
}

export interface KitsState {
  kits: {
    [serial: string]: KitState;
  };
}

const initial: KitsState = {
  kits: {},
};

const initialKit: KitState = {
  details: null,
  configurations: null,
  loadingConfigurations: false,
  rawMeasurements: {},
  status: "None",
};

export type KitAction = ActionType<typeof actions>;

const kitReducer = createReducer<KitState, KitAction>(initialKit)
  .handleAction(actions.fetchKit, (state, action) => {
    return { ...state, status: "Fetching" };
  })
  .handleAction(actions.notFound, (state, action) => {
    return { ...state, status: "NotFound" };
  })
  .handleAction(actions.notAuthorized, (state, action) => {
    return { ...state, status: "NotAuthorized" };
  })
  .handleAction(actions.addKit, (state, action) => {
    return {
      ...state,
      details: action.payload,
      status: "Fetched",
    };
  })
  .handleAction(actions.kitConfigurationsRequest, (state, action) => {
    return { ...state, loadingConfigurations: true };
  })
  .handleAction(actions.kitConfigurationsSuccess, (state, action) => {
    let configurations: { [id: string]: KitConfigurationState } = {};
    let existingConfigurations: {
      [id: string]: KitConfigurationState;
    } = state.configurations || {};
    for (const { peripherals, ...confRest } of action.payload.configurations) {
      const conf = {
        ...confRest,
        peripherals: arrayToObject(peripherals, (peripheral) =>
          peripheral.id.toString()
        ),
      };

      if (
        conf.id in existingConfigurations &&
        isEqual(conf, existingConfigurations[conf.id])
      ) {
        configurations[conf.id] = existingConfigurations[conf.id];
      } else {
        configurations[conf.id] = conf;
      }
    }

    return {
      ...state,
      configurations: configurations,
      loadingConfigurations: false,
    };
  })
  .handleAction(actions.kitSetAllConfigurationsInactive, (state, action) => {
    if (state.configurations === null) {
      return state;
    } else {
      const oldConfigurations = state.configurations;
      let configurations: { [id: string]: KitConfigurationState } = {};
      for (const id of Object.keys(oldConfigurations)) {
        const conf = oldConfigurations[id];
        configurations[id] = { ...conf, active: false };
      }

      return { ...state, configurations: configurations };
    }
  })
  .handleAction(actions.rawMeasurementReceived, (state, action) => {
    let rawMeasurements = state.rawMeasurements;
    const { peripheral, quantityType } = action.payload.rawMeasurement;
    rawMeasurements[peripheral + "." + quantityType] =
      action.payload.rawMeasurement;

    return { ...state, rawMeasurements };
  });

const kitReducerWrapper = (state: KitState, action: any) => {
  const state2 = kitReducer(state, action) as any;

  let newConfigurations = kitConfigurationReducerById(
    state2.configurations || {},
    action
  );

  if (
    state2.configurations === null &&
    Object.keys(newConfigurations).length === 0
  ) {
    return { ...state2, configurations: null };
  } else {
    return { ...state2, configurations: newConfigurations };
  }
};

const kitConfigurationReducer = createReducer<KitConfigurationState, KitAction>(
  {} as KitConfigurationState
)
  .handleAction(actions.kitConfigurationCreated, (state, action) => {
    const { configuration } = action.payload;
    const configurationWithPeripherals: KitConfigurationState = {
      ...configuration,
      peripherals: {},
    };

    return configurationWithPeripherals;
  })
  .handleAction(actions.kitConfigurationUpdated, (state, action) => {
    const { configuration } = action.payload;
    const existingConfigurationPeripherals = state.peripherals || [];

    const newConfiguration = {
      ...configuration,
      peripherals: existingConfigurationPeripherals,
    };

    return newConfiguration;
  });

const kitConfigurationReducerWrapper = (
  state: KitConfigurationState,
  action: any
) => {
  const state2 = kitConfigurationReducer(state, action) as any;
  const newPeripherals = peripheralReducerById(
    state2.peripherals,
    action
  ) as any;
  return { ...state2, peripherals: newPeripherals };
};

const peripheralReducer = createReducer<Peripheral, KitAction>({} as Peripheral)
  .handleAction(actions.peripheralCreated, (state, action) => {
    return action.payload.peripheral;
  })
  .handleAction(actions.peripheralUpdated, (state, action) => {
    return action.payload.peripheral;
  })
  .handleAction(actions.peripheralDeleted, (state, action) => {
    return undefined as any;
  });

const kitReducerById = byId(
  (action: any) => (action.payload || {}).serial,
  kitReducerWrapper as any
);

const kitConfigurationReducerById = byId((action: any) => {
  const maybeWithConfiguration = action.payload || {};
  return (
    (maybeWithConfiguration.configuration || {}).id ||
    maybeWithConfiguration.configurationId
  );
}, kitConfigurationReducerWrapper as any);

const peripheralReducerById = byId((action: any) => {
  const maybeWithPeripheral = action.payload || {};
  return (
    (maybeWithPeripheral.peripheral || {}).id ||
    maybeWithPeripheral.peripheralId
  );
}, peripheralReducer as any);

export default function (state = initial, action: any) {
  const { kits, ...otherState } = state;

  const newKits = kitReducerById(kits, action) as any;

  return { ...otherState, kits: newKits };
}
