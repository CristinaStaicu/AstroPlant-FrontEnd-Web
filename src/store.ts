import { createStore, applyMiddleware } from "redux";
import { createEpicMiddleware } from "redux-observable";
import { persistStore } from "redux-persist";
import { rootReducer, rootEpic } from "./root";

const logger = (store: any) => (next: any) => (action: any) => {
  console.group(action.type);
  console.info("dispatching", action);
  let result = next(action);
  console.log("next state", store.getState());
  console.groupEnd();
  return result;
};

const epicMiddleware = createEpicMiddleware();

export const store = createStore(
  rootReducer,
  applyMiddleware(logger, epicMiddleware)
);
export const persistor = persistStore(store);

epicMiddleware.run(rootEpic);
