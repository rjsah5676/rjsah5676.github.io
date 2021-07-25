import React from 'react';
import styled, { keyframes } from 'styled-components';
const faded = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;
const Faded = ({
  duration = 1200,
  delay = 0,
  children,
  ...delegated
}) => {
  return (
    <Wrapper
      {...delegated}
      style={{
        ...(delegated.style || {}),
        animationDuration: duration + 'ms',
        animationDelay: delay + 'ms',
      }}
    >
      {children}
    </Wrapper>
  );
};
const Wrapper = styled.div`
  @media (prefers-reduced-motion: no-preference) {
    animation-name: ${faded};
    animation-fill-mode: backwards;
  }
`;
export default Faded;