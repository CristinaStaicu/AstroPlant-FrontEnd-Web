import React, { useState, useRef } from "react";
import { compose } from "recompose";
import { withTranslation, WithTranslation } from "react-i18next";
import { Modal, Header, Button, Select, Icon } from "semantic-ui-react";
import produce from "immer";
import { JSONSchema7 } from "json-schema";
import RjsfForm from "rjsf-theme-semantic-ui";

import { Peripheral } from "astroplant-api";

import {
  OutputSettings,
  continuousOutputSettingsSchema,
  continuousOutputSettingsUiSchema,
  scheduledOutputSettingsSchema,
  scheduledOutputSettingsUiSchema,
} from "../schemas";

export type Props = {
  peripheral: Peripheral;
  command: string;
  schema: JSONSchema7;
  outputSettings: OutputSettings;
  edit: (
    peripheral: Peripheral,
    command: string,
    outputSettings: OutputSettings
  ) => void;
  delete: (peripheral: Peripheral, command: string) => void;
  close: () => void;
};

type PInner = Props & WithTranslation;

type OutputType = "continuous" | "scheduled";

function EditOutput(props: PInner) {
  const { peripheral, command, schema, outputSettings } = props;
  const commandIsNumber = schema.type && schema.type === "number";

  const possibleOutputTypes: Array<OutputType> = commandIsNumber
    ? ["continuous", "scheduled"]
    : ["scheduled"];

  let initialOutputType = possibleOutputTypes[0];
  try {
    initialOutputType = outputSettings.type;
  } catch (_e) {}
  const [outputType, setOutputType] = useState<OutputType>(initialOutputType);

  let outputSettingsSchemaModified: JSONSchema7;
  let outputSettingsUiSchema: any;
  let data: any;
  if (outputType === "continuous") {
    outputSettingsSchemaModified = produce(
      continuousOutputSettingsSchema,
      (draft) => {
        // @ts-ignore
        draft.properties.minimal = schema;
        // @ts-ignore
        draft.properties.maximal = schema;
      }
    );
    outputSettingsUiSchema = continuousOutputSettingsUiSchema;
    data = outputSettings.continuous;
  } else if (outputType === "scheduled") {
    outputSettingsSchemaModified = produce(
      scheduledOutputSettingsSchema,
      (draft) => {
        // @ts-ignore
        draft.properties.schedules.items.properties.schedule.items.properties.value = schema;
      }
    );
    outputSettingsUiSchema = produce(
      scheduledOutputSettingsUiSchema,
      (draft) => {
        // @ts-ignore
        draft.interpolated["ui:disabled"] = !commandIsNumber;
      }
    );
    data = outputSettings.scheduled;
  } else {
    throw new Error("Unknown output type");
  }
  const [formData, setFormData] = useState(data);

  const submitButtonRef = useRef(null);

  const handleClose = () => {
    props.close();
  };

  const handleDelete = (peripheral: Peripheral, command: string) => {
    props.delete(peripheral, command);
    handleClose();
  };

  const handleSubmit = (
    peripheral: Peripheral,
    command: string,
    outputSettings: any
  ) => {
    if (outputType === "continuous") {
      props.edit(peripheral, command, {
        type: "continuous",
        continuous: outputSettings,
      });
    } else if (outputType === "scheduled") {
      for (const schedule of outputSettings.schedules) {
        schedule.schedule.sort((a: any, b: any) => {
          if (a.time < b.time) {
            return -1;
          } else if (a.time === b.time) {
            return 0;
          } else {
            return 1;
          }
        });
      }

      props.edit(peripheral, command, {
        type: "scheduled",
        scheduled: outputSettings,
      });
    }
    handleClose();
  };

  return (
    <Modal
      closeOnEscape={true}
      closeOnDimmerClick={true}
      open={true}
      onClose={handleClose}
    >
      <Modal.Header>
        <Icon name="cogs" /> {peripheral.name} — {command}
      </Modal.Header>
      <Modal.Content scrolling>
        <Header size="small">Please choose the output type:</Header>
        <Select
          options={possibleOutputTypes.map((outputType) => ({
            text: outputType,
            value: outputType,
          }))}
          value={outputType}
          onChange={(_e, data) => setOutputType(data.value as OutputType)}
        />
        <RjsfForm
          schema={outputSettingsSchemaModified}
          uiSchema={outputSettingsUiSchema}
          onSubmit={({ formData }) =>
            handleSubmit(peripheral, command, formData)
          }
          formData={formData}
          onChange={({ formData }) => setFormData(formData)}
        >
          <input
            ref={submitButtonRef}
            type="submit"
            style={{ display: "none" }}
          />
        </RjsfForm>
      </Modal.Content>
      <Modal.Actions>
        <Button
          primary
          onClick={() => (submitButtonRef.current! as any).click()}
        >
          Submit
        </Button>
        <Button secondary onClick={() => handleDelete(peripheral, command)}>
          Delete
        </Button>
        <Button color="red" onClick={handleClose}>
          Cancel
        </Button>
      </Modal.Actions>
    </Modal>
  );
}

export default compose<PInner, Props>(withTranslation())(EditOutput);
