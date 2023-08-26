import {
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile,
} from 'obsidian'
import BibleReferencePlugin from '../main'
import { verseMatch } from '../utils/verseMatch'
import { VerseSuggesting } from '../VerseSuggesting'
import {
  API_WAITING_LABEL,
  BibleReferencePluginSettings,
} from '../data/constants'
import { getSuggestionsFromQuery } from './getSuggestionsFromQuery'

/**
 * Extend the EditorSuggest to suggest bible verses.
 */
export class VerseEditorSuggester extends EditorSuggest<VerseSuggesting> {
  plugin: BibleReferencePlugin
  settings: BibleReferencePluginSettings

  constructor(
    plugin: BibleReferencePlugin,
    settings: BibleReferencePluginSettings
  ) {
    super(plugin.app)
    this.plugin = plugin
    this.settings = settings
  }

  /**
   * This will build the EditorSuggestContext in getSuggestions
   * @param cursor
   * @param editor
   * @param _
   */
  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
    _: TFile
  ): EditorSuggestTriggerInfo | null {
    // @ts-ignore
    const suggestEl = this.suggestEl as HTMLDivElement
    suggestEl.createDiv({cls: 'obr-loading-container'}).hide()

    const currentContent = editor.getLine(cursor.line).substring(0, cursor.ch)

    if (currentContent === '--vod') {
      return {
        end: cursor,
        start: {
          line: cursor.line,
          ch: currentContent.lastIndexOf('--vod'),
        },
        query: '--vod',
      }
    }

    const match = verseMatch(currentContent, false)
    if (match || currentContent === '--vod') {
      console.debug('trigger on', currentContent)
      return {
        end: cursor,
        start: {
          line: cursor.line,
          ch: currentContent.lastIndexOf(match),
        },
        query: match,
      }
    }
    return null
  }

  /**
   * Suggest bible verses.
   * @param context
   */
  async getSuggestions(
    context: EditorSuggestContext
  ): Promise<VerseSuggesting[]> {
    // @ts-ignore
    const suggestEl = this.suggestEl as HTMLDivElement
    // @ts-ignore
    const suggestionsEl = (this.suggestions as any)
      .containerEl as HTMLDivElement
    suggestionsEl.hide()

    const loadingContainer = suggestEl.getElementsByClassName(
      'obr-loading-container'
    )[0] as HTMLDivElement
    loadingContainer.setText(API_WAITING_LABEL)
    loadingContainer.show()

    const suggestions = await getSuggestionsFromQuery(context.query, this.settings)
    loadingContainer.hide()
    suggestionsEl.show()
    return suggestions
  }

  renderSuggestion(suggestion: VerseSuggesting, el: HTMLElement): void {
    suggestion.renderSuggestion(el)
  }

  selectSuggestion(suggestion: VerseSuggesting): void {
    if (this.context) {
      /* prettier-ignore */
      (this.context.editor as Editor).replaceRange(
        suggestion.ReplacementContent,
        this.context.start,
        this.context.end
      )
    }
  }
}
