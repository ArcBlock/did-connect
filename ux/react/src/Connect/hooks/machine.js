// Note: this custom hook exists because of: https://github.com/statelyai/xstate/issues/1101
import { useState, useEffect, useMemo } from 'react';
import { interpret, State } from 'xstate';

export default function useMachine(machine, options = {}) {
  const {
    context,
    guards,
    actions,
    activities,
    services,
    delays,
    state: rehydratedState,
    ...interpreterOptions
  } = options;

  const service = useMemo(() => {
    const machineConfig = {
      context,
      guards,
      actions,
      activities,
      services,
      delays,
    };

    const createdMachine = machine.withConfig(machineConfig, {
      ...machine.context,
      ...context,
    });

    return interpret(createdMachine, interpreterOptions).start(
      rehydratedState ? State.create(rehydratedState) : undefined
    );
  }, [machine]); // eslint-disable-line

  const [state, setState] = useState(service.state);

  useEffect(() => {
    service.onTransition((currentState) => {
      if (currentState.changed) {
        setState(currentState);
      }
    });

    // if service.state has not changed React should just bail out from this update
    setState(service.state);

    return () => {
      service.stop();
    };
  }, [service]);

  // Make sure actions and services are kept updated when they change.
  // This mutation assignment is safe because the service instance is only used
  // in one place -- this hook's caller.
  useEffect(() => {
    Object.assign(service.machine.options.actions, actions);
  }, [service, actions]);

  useEffect(() => {
    Object.assign(service.machine.options.services, services);
  }, [service, services]);

  return [state, service.send, service];
}
