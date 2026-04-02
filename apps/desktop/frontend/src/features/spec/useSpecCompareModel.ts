import {
  defaultSpecCommon,
} from '../../useDesktopModeState'
import { useSpecCompareWorkflow, type UseSpecCompareWorkflowOptions } from './useSpecCompareWorkflow'
import { useSpecCompareViewState } from './useSpecCompareViewState'
import type { TextDiffLayout } from '../text/useTextDiffViewState'

export type SpecCompareModelDeps = Pick<
  UseSpecCompareWorkflowOptions,
  'getCompareSpecValuesRich' | 'getPickSpecFile' | 'getLoadTextFile' | 'onSpecCompareCompleted'
> & {
  textDiffLayout: TextDiffLayout
}

export function useSpecCompareModel(deps: SpecCompareModelDeps) {
  const workflow = useSpecCompareWorkflow({
    initialCommon: defaultSpecCommon,
    getCompareSpecValuesRich: deps.getCompareSpecValuesRich,
    getPickSpecFile: deps.getPickSpecFile,
    getLoadTextFile: deps.getLoadTextFile,
    onSpecCompareCompleted: deps.onSpecCompareCompleted,
  })

  const viewState = useSpecCompareViewState({
    specRichResult: workflow.specRichResult,
    specOldText: workflow.specOldText,
    specNewText: workflow.specNewText,
    textDiffLayout: deps.textDiffLayout,
  })

  const compareDisabled =
    workflow.specEditorBusy || workflow.specInputEmpty || workflow.specInputInvalid

  return { workflow, viewState, compareDisabled }
}

export type SpecCompareModel = ReturnType<typeof useSpecCompareModel>
