// Note: this custom hook exists because of: https://github.com/statelyai/xstate/issues/1101
import { useState, useEffect, useMemo } from 'react';
import { interpret, State } from 'xstate';

export default function useMachine(machine: any, options = {}) {
  const {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'context' does not exist on type '{}'.
    context,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'guards' does not exist on type '{}'.
    guards,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'actions' does not exist on type '{}'.
    actions,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'activities' does not exist on type '{}'.
    activities,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'services' does not exist on type '{}'.
    services,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'delays' does not exist on type '{}'.
    delays,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'state' does not exist on type '{}'.
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
    // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
    Object.assign(service.machine.options.actions, actions);
  }, [service, actions]);

  useEffect(() => {
    // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
    Object.assign(service.machine.options.services, services);
  }, [service, services]);

  return [state, service.send, service];
}
