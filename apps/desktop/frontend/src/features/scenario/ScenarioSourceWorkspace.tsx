import { ScenarioControlPanel, type ScenarioControlPanelProps } from './ScenarioControlPanel'

export type ScenarioSourceWorkspaceProps = ScenarioControlPanelProps

export function ScenarioSourceWorkspace(props: ScenarioSourceWorkspaceProps) {
  return <ScenarioControlPanel {...props} />
}
