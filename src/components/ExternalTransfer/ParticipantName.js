import * as React from 'react';
import { connect } from 'react-redux';
import styled from '@emotion/styled';
import { Manager, withTheme } from '@twilio/flex-ui';
import { request } from '../../helpers/request';

const Name = styled('div')`
  font-size: 14px;
  font-weight: bold;
  margin-top: 10px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NameListItem = styled('div')`
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`;

const getRealName = (name) => {

  const { REACT_APP_EXTERNAL_SIP } = process.env;

  if(name && REACT_APP_EXTERNAL_SIP) {

    const regex = new RegExp(REACT_APP_EXTERNAL_SIP.replace("{{Resource}}", "(.*)"));
    const matchRegex = name.match(regex);

    if(matchRegex){
      return matchRegex[1];
    }

  }

  return name;
} 

class ParticipantName extends React.Component {
  state = {
    name: ''
  };

  componentDidMount() {
    const { participant, task } = this.props;

    if (participant.participantType === 'customer') {
      this.setState({ name: task.attributes.outbound_to || task.attributes.name });
      return;
    }

    if (participant.participantType === 'unknown') {
      request('external-transfer/get-call-properties', Manager.getInstance(), {
        callSid: participant.callSid
      }).then(response => {
        if (response) {
          const name = (response && response.to) || 'unknown';
          this.setState({ name });
        }
      });
    } else {
      this.setState({ name: participant.worker ? participant.worker.fullName : 'unknown' });
    }
  }

  render() {
    return this.props.listMode
      ? (
        <NameListItem className="ParticipantCanvas-Name">
          {getRealName(this.state.name)}
        </NameListItem>
      ) : (
        <Name className="ParticipantCanvas-Name">
          {getRealName(this.state.name)}
        </Name>
      );
  }
}

const mapStateToProps = state => {
  const { serviceBaseUrl } = state.flex.config;

  return {
    serviceBaseUrl,
  };
};

export default connect(mapStateToProps)(withTheme(ParticipantName));
