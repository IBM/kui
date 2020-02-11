/*
 * Copyright 2020 IBM Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { keys } from '../keys'
import { Tab, getTabId } from '../tab'
import { isPopup } from '../popup-core'
import eventBus from '../../core/events'
import { scrollIntoView } from '../scroll'
import { getCurrentPrompt } from '../prompt'
import Presentation from '../views/presentation'
import { KuiFramedComponent, isSingleton } from './component'

/** toggling classes */
type Op = (elt: Element, cls: string) => void
const remove: Op = (elt: Element, cls: string) => elt.classList.remove(cls)
// const add: Op = (elt: Element, cls: string) => elt.classList.add(cls)
const toggle: Op = (elt: Element, cls: string) => elt.classList.toggle(cls)

export default class KuiFrame {
  /**
   * Cleaners for any global handlers we might have registered
   *
   */
  private cleaners: (() => void)[] = []

  /**
   * The internal DOM representation
   *
   */
  private readonly dom: HTMLElement

  public constructor() {
    // some song and dance to get the html into a live dom
    const { default: frameSrc } = require('@kui-shell/core/web/html/KuiFrame.html')
    const tmp = document.createElement('div')
    tmp.innerHTML = frameSrc

    // now we have a live dom for the frame
    this.dom = tmp.querySelector('sidecar') as HTMLElement
  }

  public attach(component: KuiFramedComponent, tab: Tab) {
    // the container for the frame
    const container =
      component.frame.position === 'TabColumn' ? tab.querySelector('tabcolumn') : tab.querySelector('tabrow')

    if (isSingleton(component)) {
      const { viewId } = component.frame

      const existing = container.querySelector(`[data-view-id=${viewId}]`)
      if (existing) {
        existing.remove()
      }

      this.dom.setAttribute('data-view-id', viewId)
    }

    if (component.frame.kind) {
      let iconText = component.frame.kind.replace(/s$/, '')
      const A = iconText.split(/(?=[A-Z])/).filter(x => x)
      if (iconText.length > 12 && A.length > 1) {
        iconText = A.map(_ => _.charAt(0)).join('')
      }

      const kind = this.dom.querySelector('.sidecar-header-icon') as HTMLElement
      kind.innerText = iconText
    }

    if (component.frame.metadata.namespace) {
      const ns = this.dom.querySelector('.package-prefix') as HTMLElement
      ns.innerText = component.frame.metadata.namespace

      if (component.spec.onclick && component.spec.onclick.namespace) {
        ns.classList.add('clickable')
        ns.onclick = () => tab.REPL.pexec(component.spec.onclick.namespace)
      }
    }

    this.initEvents(tab)
    this.presentAs(tab, component.frame.presentation)

    // FIXME; the custom-content part we can fix, once we unlock sidecar.css
    this.setVisible(tab)
    this.dom.classList.add('visible', 'custom-content')

    const wrapper = document.createElement('div')
    wrapper.classList.add('kui--sidecar-header-and-body')
    wrapper.appendChild(component.spec.content)
    this.dom.appendChild(wrapper)
    container.appendChild(this.dom)
  }

  /**
   * Escape key toggles sidecar visibility
   *
   */
  private initEscapeKeyHandler(tab: Tab) {
    const handler = (evt: KeyboardEvent) => {
      if (
        document.activeElement &&
        !(
          document.activeElement === document.body ||
          document.activeElement.classList.contains('inputarea') || // monaco-editor
          document.activeElement.classList.contains('repl-input-element')
        )
      ) {
        // not focused on repl
        return
      }

      if (evt.keyCode === keys.ESCAPE) {
        if (!isPopup()) {
          const closeButton = tab.querySelector('sidecar .sidecar-bottom-stripe-close')
          if (this.isVisible()) {
            closeButton.classList.add('hover')
            setTimeout(() => closeButton.classList.remove('hover'), 500)
          }
          this.toggle(tab)
          scrollIntoView()
        }
      }
    }

    document.addEventListener('keyup', handler)
    this.cleaners.push(() => {
      document.removeEventListener('keyup', handler)
    })
  }

  /**
   * Listen for cleanup notifications
   *
   */
  private initCloseAllHandler(tab: Tab) {
    const handler = async (otab: Tab) => {
      if (getTabId(tab) === getTabId(otab)) {
        this.close()
      }
    }

    eventBus.on('/close/views/in/tab', handler)
    this.cleaners.push(() => {
      eventBus.off('/close/views/in/tab', handler)
    })
  }

  /**
   * Ensure that we are in sidecar maximization mode
   *
   */
  private toggleMaximization(tab: Tab, op = toggle) {
    if (isPopup()) {
      op(document.body, 'sidecar-full-screen')
      op(document.body, 'sidecar-visible')
    }

    const before = tab.classList.contains('sidecar-full-screen')
    op(tab, 'sidecar-full-screen')
    const after = tab.classList.contains('sidecar-full-screen')

    if (before !== after) {
      setTimeout(() => eventBus.emit('/sidecar/maximize', this), 0)
    }
  }

  /**
   * Is the sidecar currently visible in the given tab
   *
   */
  public isVisible(): boolean {
    return this.dom.classList.contains('visible')
  }

  private enableTabIndex(tabbable = true) {
    const notabElements = this.dom.querySelectorAll('.kui--notab-when-sidecar-hidden')

    notabElements.forEach(element => {
      if (tabbable) {
        element.removeAttribute('tabindex')
      } else {
        element.setAttribute('tabindex', '-1')
      }
    })
  }

  private setVisibleClass() {
    this.dom.classList.remove('minimized')
    this.dom.classList.add('visible')
    this.enableTabIndex()
  }

  private setVisible(tab: Tab) {
    this.setVisibleClass()

    tab.classList.remove('sidecar-is-minimized')
    this.dom.classList.remove('minimized')
    document.body.classList.add('sidecar-visible')

    const replView = tab.querySelector('.repl')
    replView.classList.add('sidecar-visible')

    // scrollIntoView()

    setTimeout(() => eventBus.emit('/sidecar/toggle', { sidecar: this.dom, tab }), 0)
  }

  private show(tab: Tab) {
    this.setVisible(tab)
    this.enableTabIndex()
    return true
  }

  private hide(tab: Tab, clearSelectionToo = false) {
    this.dom.classList.remove('visible')
    this.enableTabIndex(false)

    if (!clearSelectionToo) {
      // only minimize if we weren't asked to clear the selection
      this.dom.classList.add('minimized')
      tab.classList.add('sidecar-is-minimized')
    } else {
      document.body.classList.remove('sidecar-visible')
    }

    const replView = tab.querySelector('.repl')
    replView.classList.remove('sidecar-visible')

    // we just hid the sidecar. make sure the current prompt is active for text input
    /// ////// cli.getCurrentPrompt().focus()

    setTimeout(() => eventBus.emit('/sidecar/toggle', { sidecar: this.dom, tab }), 0)
    return true
  }

  private clearSelection(tab: Tab) {
    // true means also clear selection model
    return this.hide(tab, true)
  }

  /**
   * Presentation hint
   *
   */
  private presentAs(tab: Tab, presentation: Presentation) {
    document.body.setAttribute('data-presentation', Presentation[presentation].toString())
    if (!isPopup() && presentation === Presentation.Default && tab.getAttribute('maximization-cause') !== 'user') {
      this.toggleMaximization(tab, remove)
    }
  }

  /**
   * Toggle sidecar visibility
   *
   */
  private toggle(tab: Tab) {
    if (!this.isVisible()) {
      return this.show(tab)
    } else {
      const presentationString = document.body.getAttribute('data-presentation') as keyof typeof Presentation
      const presentation: Presentation = presentationString && Presentation[presentationString]
      // Key.Escape for Presentation.SidecarThin is interpreted as Close
      return presentation === Presentation.SidecarThin ? this.clearSelection(tab) : this.hide(tab)
    }
  }

  private destroy() {
    this.dom.remove()
    this.cleaners.forEach(cleaner => {
      cleaner()
    })
  }

  /**
   * Close the DOM and destroy any associated resources
   *
   */
  private close() {
    try {
      if (isPopup()) {
        window.close()
      } else {
        this.destroy()
      }
    } catch (err) {
      console.error('error handling quit button click', err)
    }

    getCurrentPrompt().focus()
  }

  /**
   * Add onclick handlers to Frame Buttons
   *
   */
  private initEvents(tab: Tab) {
    this.initEscapeKeyHandler(tab)
    this.initCloseAllHandler(tab)

    // maximize button
    ;(this.dom.querySelector('.toggle-sidecar-maximization-button') as HTMLElement).onclick = () => {
      // indicate that the user requested maximization
      this.toggleMaximization(tab)
    }

    // close button
    ;(this.dom.querySelector('.toggle-sidecar-button') as HTMLElement).onclick = () => {
      this.toggle(tab)
    }

    // quit button
    ;(this.dom.querySelector('.sidecar-bottom-stripe-quit') as HTMLElement).onclick = () => {
      this.close()
    }

    // screenshot button
    ;(this.dom.querySelector('.sidecar-screenshot-button') as HTMLElement).onclick = () => {
      tab.REPL.pexec('screenshot sidecar')
    }
  }
}
