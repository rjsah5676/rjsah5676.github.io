import React from 'react';
import styled, { keyframes } from 'styled-components';
const fadeIn = keyframes`
  from {
    opacity: 0;
    margin-left:700px;
  }
  to {
    opacity: 1;
    margin-left:0px;
  }
`;
const FadeIn = ({
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
    animation-name: ${fadeIn};
    animation-fill-mode: backwards;
  }
`;
export default FadeIn;