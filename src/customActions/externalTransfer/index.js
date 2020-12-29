import ConferenceService from '../../helpers/ConferenceService';
import { findWorkers, findQueues, findQueueFromEnv } from '../../helpers/utils';

export const kickExternalTransferParticipant = (payload) => {
    const { task, targetSid } = payload;

    const conference = task.attributes.conference ? 
        task.attributes.conference.sid : 
        task.conference.conferenceSid;

    const participantSid = targetSid;

    console.log(`Removing participant ${participantSid} from conference`);
    return ConferenceService.removeParticipant(conference, participantSid);
}

export const addExternalParticipant = async (manager, from, target, task, forceSip) => {

    const { REACT_APP_HOLD_CUSTOMER_TRANSFER } = process.env;


    const to = handleExternalNumber(target, task, forceSip);

    const conference = task && (task.conference || {});
    const { conferenceSid } = conference;

    const mainConferenceSid = task.attributes.conference ? 
        task.attributes.conference.sid : conferenceSid;
    
    if(!from) {
        from = manager.serviceConfiguration.outbound_call_flows.default.caller_id;
    }

    console.log(from, to, mainConferenceSid);

    // Adding entered number to the conference
    console.log(`Adding ${to} to conference`);
    let participantCallSid;
    try {


        if(REACT_APP_HOLD_CUSTOMER_TRANSFER === "true") {
            await ConferenceService.holdCustomer(manager, mainConferenceSid);
        }

        participantCallSid = await ConferenceService.addParticipant(mainConferenceSid, from, to);
        ConferenceService.addConnectingParticipant(mainConferenceSid, participantCallSid, 'unknown');

    } catch (error) {
        console.error('Error adding conference participant:', error);
    }

}

export const handleExternalNumber = (number, task, forceSip) => {
    let to = number; 

    const { REACT_APP_EXTERNAL_SIP, REACT_APP_EXTERNAL_SIP_TARGET_PATTERN } = process.env;

    if(
        (
            to.match(new RegExp(REACT_APP_EXTERNAL_SIP_TARGET_PATTERN || null, "g")) ||
            forceSip
        )
        && REACT_APP_EXTERNAL_SIP
    ) {

        const attributes = Object.keys(process.env).reduce((pr, cur, idx) => {

            const attr = cur.match(/REACT_APP_SIP_ATTR_(.*)/);
            
            if(attr){
                return `${pr}${idx === 0 ? "" : "&"}X-${attr[1]}=${task.attributes[process.env[cur]]}`;
            }
    
            return pr;
    
        }, "");

        to = `${REACT_APP_EXTERNAL_SIP.replace(/{{.*}}/, number)}?${attributes !== "" ? attributes : ""}`;

    }

    return to;
}

export const makeExternalTransfer = async (manager, payload) => {

    const { targetSid, task, options } = payload;
   
    if(targetSid.match(/WK.*/)) {
      
        const { workerList: [ worker ] } = await findWorkers(manager, `data.worker_sid == "${targetSid}"`);
        
        if(worker.attributes.external){

            if(options.mode === "COLD"){
                alert("This worker is outside Flex. A warm transfer will be made instead.")
            }

            addExternalParticipant(manager, null, worker.attributes.external, task);

            return true;

        }
    
    }
  
    if(targetSid.match(/WQ.*/)) {

        const { queueList: [ queue ] } = await findQueues(manager, `data.queue_sid == "${targetSid}"`);

        if(findQueueFromEnv(queue.queue_name)) {

            if(options.mode === "COLD"){
                alert("This queue is outside Flex. A warm transfer will be made instead.")
            }
            
            addExternalParticipant(manager, null, queue.queue_name, task, true);

            return true;

        }

    }

    return false;
}