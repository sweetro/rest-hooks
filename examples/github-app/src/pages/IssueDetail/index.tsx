import { useSuspense, useController, useFetch, useCache } from 'rest-hooks';
import { Card, Avatar } from 'antd';
import { groupBy } from 'lodash';
import React, { useMemo, memo } from 'react';
import Markdown from 'react-markdown';
import Boundary from 'Boundary';
import { Link } from '@anansi/router';

import IssueResource from '../../resources/IssueResource';
import ReactionResource from '../../resources/ReactionResource';
import CommentsList, { CardLoading } from './CommentsList';

const { Meta } = Card;

type Props = Pick<IssueResource, 'repositoryUrl'>;

function ReactionSpan({
  reactions,
  issue,
}: {
  reactions: ReactionResource[];
  issue: IssueResource;
}) {
  const { fetch } = useController();
  const handleClick = () => {
    fetch(
      ReactionResource.create(),
      { repositoryUrl: issue.repositoryUrl, number: issue.number },
      { content: reactions[0].content },
    );
  };
  return (
    <span onClick={handleClick}>
      {reactions[0].contentIcon} {reactions.length}
    </span>
  );
}

function IssueDetail({ number: s }: { number: string }) {
  const number = Number.parseInt(s, 10);

  useFetch(ReactionResource.list(), {
    repositoryUrl: 'https://api.github.com/repos/facebook/react',
    number,
  });
  const issue = useSuspense(IssueResource.detail(), {
    repositoryUrl: 'https://api.github.com/repos/facebook/react',
    number,
  });
  const { results: reactions } = useCache(ReactionResource.list(), {
    repositoryUrl: 'https://api.github.com/repos/facebook/react',
    number,
  });

  const actions: JSX.Element[] = useMemo(() => {
    const grouped = groupBy(reactions, (reaction) => reaction.content);
    return Object.entries(grouped).map(([k, v]) => (
      <ReactionSpan key={k} reactions={v} issue={issue} />
    ));
  }, [reactions, issue]);

  return (
    <React.Fragment>
      <Card actions={actions}>
        <Meta
          avatar={
            <Link name="ProfileDetail" props={{ login: issue.user.login }}>
              <Avatar src={issue.user.avatarUrl} />
            </Link>
          }
          title={issue.title}
          description={<Markdown>{issue.body}</Markdown>}
        />
      </Card>
      {issue.comments ? (
        <Boundary fallback={<CardLoading />}>
          <CommentsList issueUrl={issue.url} />
        </Boundary>
      ) : null}
    </React.Fragment>
  );
}
export default memo(IssueDetail);