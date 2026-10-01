import HTMLText
import Testing

@Test func `decodes decimal, hex and named entities`() {
	#expect(decodeEntities("Grab &#039;n&#039; Go") == "Grab 'n' Go")
	#expect(decodeEntities("&#x24;12.00") == "$12.00")
	#expect(decodeEntities("Salt &amp; Pepper") == "Salt & Pepper")
}

@Test func `leaves an unknown named entity alone`() {
	#expect(decodeEntities("&bogus;") == "&bogus;")
}

@Test func `strips tags and collapses whitespace`() {
	#expect(htmlText("<td>\n\t\tStandard Tier 1 (ST1)   </td>") == "Standard Tier 1 (ST1)")
	#expect(htmlText("$12.00&nbsp;/hour") == "$12.00 /hour")
}
