import React, { useState } from 'react'
import { Prompt } from 'react-router-dom'

const Input = ({ initialValue, breadcrumbs, renderBreadcrumbs }) => {
  const [value, setValue] = useState(initialValue)
  const handleChange = (e) => setValue(e.target.value)

  return (
    <>
      <input type="text" value={value} onChange={handleChange} />
      <br />
      <small>
        (delete some letters from the input value above and try to navigate to
        another page)
      </small>
      {renderBreadcrumbs(breadcrumbs)}
      <Prompt
        when={value !== initialValue}
        message="Are you sure you want to leave?"
      />
    </>
  )
}

export default Input
