// @flow

import React from 'react'
import AsyncComponent, {type Props as AsyncProps} from 'react-async'
import {LoadingView, DataErrorView, NoDataView} from '@frogpond/notice'

export function Async<T>(props: AsyncProps<T>) {
	return (
		<AsyncComponent {...props}>
			{({data, isLoading, reload, error, startedAt, finishedAt}) => {
				if (!data && isLoading) {
					return <LoadingView startedAt={startedAt} />
				}

				if (error) {
					return <DataErrorView error={error} retry={reload} />
				}

				if (!data) {
					return <NoDataView retry={reload} />
				}

				return this.props.children({
					data,
					isLoading,
					reload,
					startedAt,
					finishedAt,
				})
			}}
		</AsyncComponent>
	)
}
