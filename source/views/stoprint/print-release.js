// @flow

import React from 'react'
import {StyleSheet, Text, Platform} from 'react-native'
import glamorous from 'glamorous-native'
import {TableView, Section, Cell} from 'react-native-tableview-simple'
import * as c from '../components/colors'
import type {Printer, PrintJob} from './types'

const Container = glamorous.scrollView({
	paddingVertical: 6,
})

const Header = glamorous.text({
	fontSize: 36,
	textAlign: 'center',
	marginTop: 20,
	marginHorizontal: 10,
	color: c.black,
})

const SubHeader = glamorous.text({
	fontSize: 21,
	textAlign: 'center',
	marginTop: 5,
})

type Props = TopLevelViewPropsType & {
	navigation: {state: {params: {job: PrintJob, printer: Printer}}},
}

function LeftDetailCell({detail, title}: {detail: string, title: string}) {
  return (
    <Cell cellStyle="LeftDetail" detail={detail} title={title}/>
  )
}

function JobInformation({job}: {job: PrintJob}) {
  return (
    <Section header="JOB INFO" sectionTintColor={c.sectionBgColor}>
      <LeftDetailCell detail="Status" title={job.statusFormatted}/>
      <LeftDetailCell detail="Time" title={job.usageTimeFormatted}/>
      <LeftDetailCell detail="Pages" title={job.totalPages}/>
      <LeftDetailCell detail="Cost" title={job.usageCostFormatted}/>
      <LeftDetailCell detail="Grayscale" title={job.grayscaleFormatted}/>
      <LeftDetailCell detail="Paper Size" title={job.paperSizeFormatted}/>
    </Section>
  )
}

function PrinterInformation({printer}: {printer: Printer}) {
  return (
    <Section header="PRINTER INFO" sectionTintColor={c.sectionBgColor}>
      <LeftDetailCell detail="Name" title={printer.printerName}/>
      {printer.location &&
        <LeftDetailCell detail="Location" title={printer.location}/>
      }
    </Section>
  )
}

export class PrintJobReleaseView extends React.PureComponent<Props> {
	static navigationOptions = {
			title: 'Release Job',
	}

	render() {
		const {job, printer} = this.props.navigation.state.params
		return (
			<Container>
				<Header>{job.documentName}</Header>
				<TableView>
					<JobInformation job={job} />
          <PrinterInformation printer={printer} />
				</TableView>
			</Container>
		)
	}
}
