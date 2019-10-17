import React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { Icon } from "semantic-ui-react";

import { JSONSchema6 } from "json-schema";
import ApiForm from "Components/ApiForm";

import { KitState } from "modules/kit/reducer";
import { kitConfigurationUpdated } from "modules/kit/actions";
import { KitConfigurationWithPeripherals } from "astroplant-api";

import { KitsApi, KitConfiguration } from "astroplant-api";
import { AuthConfiguration } from "utils/api";

export type Props = {
  kit: KitState;
  configuration: KitConfigurationWithPeripherals;
  kitConfigurationUpdated: (kitConfiguration: {
    serial: string;
    configuration: KitConfiguration;
  }) => void;
};

type State = {
  editing: boolean;
};

const DescriptionForm = ApiForm<string, KitConfiguration>();

class Description extends React.Component<Props, State> {
  state = {
    editing: false
  };

  onResponse(response: KitConfiguration) {
    const { kit } = this.props;
    this.setState({ editing: false });
    this.props.kitConfigurationUpdated({
      serial: kit.details.serial,
      configuration: response
    });
  }

  send(formData: string) {
    const { kit, configuration } = this.props;

    const api = new KitsApi(AuthConfiguration.Instance);
    return api.patchConfiguration({
      kitSerial: kit.details.serial,
      configurationId: configuration.id,
      patchKitConfiguration: {
        description: formData
      }
    });
  }

  render() {
    const { configuration } = this.props;

    if (this.state.editing) {
      const schema: JSONSchema6 = {
        type: "string",
        default: configuration.description
      };
      const uiSchema = {};

      return (
        <div>
          <DescriptionForm
            schema={schema}
            uiSchema={uiSchema}
            send={this.send.bind(this)}
            onResponse={this.onResponse.bind(this)}
          />
        </div>
      );
    } else {
      return (
        <div onClick={() => this.setState({ editing: true })}>
          <Icon name="pencil" />
          {configuration.description}
        </div>
      );
    }
  }
}

const mapDispatchToProps = (dispatch: any) =>
  bindActionCreators(
    {
      kitConfigurationUpdated
    },
    dispatch
  );

export default connect(
  null,
  mapDispatchToProps
)(Description);