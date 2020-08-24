const DINING_HOURS_PAGE_URL: &str = "https://wp.stolaf.edu/reslife/dining-hours/";

fn main() {
	let data = reqwest::blocking::get(DINING_HOURS_PAGE_URL)
		.unwrap()
		.text()
		.unwrap();

	println!("{}", data);
}
