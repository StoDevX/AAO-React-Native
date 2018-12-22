// @flow

import React from 'react'
import AsyncComponent, {type Props as AsyncProps} from 'react-async'
import {LoadingView, DataErrorView, NoDataView} from '@frogpond/notice'

export function Async<T>(props: AsyncProps<T>) {
	return (
		<AsyncComponent {...props}>
			{args => {
				if (!args.data && args.isLoading) {
					return <LoadingView startedAt={args.startedAt} />
				}

				if (args.error) {
					return <DataErrorView error={args.error} retry={args.reload} />
				}

				if (!args.data) {
					return <NoDataView retry={args.reload} />
				}

				return this.props.children(args)
			}}
		</AsyncComponent>
	)
}
