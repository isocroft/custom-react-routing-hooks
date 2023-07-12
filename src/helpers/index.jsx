import React from 'react'
import { Link } from 'react-router-dom'
import { breadcrumbsMap } from '../constants'

export const renderBreadcrumbs = (breadcrumbs) => {
  const count = breadcrumbs.length
  return (
    <>
      <h6>Breadcrumbs</h6>
      <ul
        style={{
          listStyle: 'none',
          display: 'flex',
        }}
      >
        {breadcrumbs.map((breadcrumb, index) => {
          return (
            <>
              <li
                key={String(new Date().getTime() + index)}
                style={{
                  marginRight: '5px',
                  marginLeft: '5px',
                }}
              >
                <Link to={breadcrumb.pathname}>
                  {breadcrumbsMap[breadcrumb.pathname]}
                </Link>
              </li>
              {index === count - 1 ? null : <span>{'>'}</span>}
            </>
          )
        })}
      </ul>
    </>
  )
}
