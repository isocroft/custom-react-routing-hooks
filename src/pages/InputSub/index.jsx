import React from 'react'
import { Prompt } from 'react-router-dom'

const InputSub = ({ breadcrumbs, renderBreadcrumbs }) => {
  return (
    <>
      <span>Hello to sub page</span>
      {renderBreadcrumbs(breadcrumbs)}
      <Prompt when={false} message="Are you sure you want to leave?" />
    </>
  )
}

export default InputSub
