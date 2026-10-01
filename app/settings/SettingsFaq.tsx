/**
 * The FAQs, pushed onto the Settings stack so they get a Back button there.
 *
 * The home screen's `/Faq` belongs to the root stack, so opening it from
 * inside the Settings modal would not push within Settings. This is the same
 * screen under a path in Settings' own stack.
 */
export {default} from '../Faq'
