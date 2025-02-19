import React from "react";
import { FormattedMessage } from "react-intl";
import { useResource } from "rest-hooks";

import { Button, MainPageWithScroll } from "components";
import { Routes } from "../../../routes";
import PageTitle from "components/PageTitle";
import useRouter from "components/hooks/useRouterHook";
import DestinationsTable from "./components/DestinationsTable";
import config from "config";
import DestinationResource from "core/resources/Destination";
import HeadTitle from "components/HeadTitle";
import Placeholder, { ResourceTypes } from "components/Placeholder";

const AllDestinationsPage: React.FC = () => {
  const { push } = useRouter();

  const { destinations } = useResource(DestinationResource.listShape(), {
    workspaceId: config.ui.workspaceId,
  });

  const onCreateDestination = () =>
    push(`${Routes.Destination}${Routes.DestinationNew}`);

  return (
    <MainPageWithScroll
      headTitle={<HeadTitle titles={[{ id: "admin.destinations" }]} />}
      pageTitle={
        <PageTitle
          title={<FormattedMessage id="admin.destinations" />}
          endComponent={
            <Button onClick={onCreateDestination} data-id="new-destination">
              <FormattedMessage id="destination.newDestination" />
            </Button>
          }
        />
      }
    >
      {destinations.length ? (
        <DestinationsTable destinations={destinations} />
      ) : (
        <Placeholder resource={ResourceTypes.Destinations} />
      )}
    </MainPageWithScroll>
  );
};

export default AllDestinationsPage;
