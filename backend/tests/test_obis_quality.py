import pytest
from app.services.sources import obis_quality


@pytest.mark.parametrize('patch,eligible', [
    ({'flags':[],'marine':True},True),
    ({'flags':['NO_DEPTH'],'marine':True},True),
    ({'flags':['ON_LAND']},False),
    ({'flags':'on_land,NO_DEPTH'},False),
    ({'flags':[],'marine':False},False),
    ({'flags':[],'occurrenceStatus':'absent'},False),
    ({'flags':[],'decimalLatitude':25},False),
    ({},False),
])
def test_quality_preserves_coordinates_and_does_not_equate_all_flags_with_bad_location(patch,eligible):
    row={'decimalLatitude':15,'decimalLongitude':65,**patch}
    original=dict(row)
    result=obis_quality(row,(64,14,66,16))
    assert result['map_eligible'] is eligible
    assert row==original


def test_api_retains_flagged_record_and_cursor(client,monkeypatch):
    from app.services import sources
    async def fetch(*args):
        return {'total':2,'results':[{'id':'land','scientificName':'Fixture taxon',
            'decimalLatitude':15,'decimalLongitude':65,'flags':['ON_LAND'],
            'eventDate':'2000-01-01','coordinateUncertaintyInMeters':500}]},{'source':'OBIS'}
    monkeypatch.setattr(sources,'request_json',fetch)
    data=client.get('/api/biodiversity/obis?bbox=64,14,66,16&limit=1').json()
    assert data['next_cursor']=='land' and data['total_matching']==2
    assert data['results'][0]['quality']['map_eligible'] is False
    assert data['results'][0]['coordinate_uncertainty_m']==500
